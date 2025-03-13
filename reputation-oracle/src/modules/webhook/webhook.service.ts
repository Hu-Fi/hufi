import { ChainId, EscrowClient, NETWORKS } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { lastValueFrom } from 'rxjs';
import { LessThanOrEqual } from 'typeorm';

import { RETRIES_COUNT_THRESHOLD } from '../../common/constants';
import { ErrorWebhook } from '../../common/constants/errors';
import { EventType, SortDirection, WebhookStatus } from '../../common/enums';
import { Web3TransactionStatus } from '../../common/enums/web3-transaction';
import { USDT_CONTRACT_ADDRESS } from '../../constants/token';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { Web3TransactionService } from '../web3-transaction/web3-transaction.service';

import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookIncomingDto, LiquidityDto } from './webhook.dto';
import { WebhookRepository } from './webhook.repository';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly web3Service: Web3Service,
    @Inject(StorageService)
    private readonly storageService: StorageService,
    private readonly webhookRepository: WebhookRepository,
    private readonly httpService: HttpService,
    private web3TransactionService: Web3TransactionService,
  ) {}

  /**
   * Create a incoming webhook using the DTO data.
   * @param dto - Data to create an incoming webhook.
   * @returns {Promise<boolean>} - Return the boolean result of the method.
   */
  public async createIncomingWebhook(
    dto: WebhookIncomingDto,
  ): Promise<boolean> {
    try {
      if (dto.eventType !== EventType.CAMPAIGN_PAYOUT) {
        this.logger.error(
          `Invalid event type: ${dto.eventType}`,
          WebhookService.name,
        );
        throw new BadRequestException(ErrorWebhook.InvalidEventType);
      }

      const webhookEntity = await this.webhookRepository.create({
        chainId: dto.chainId,
        escrowAddress: dto.escrowAddress,
        status: WebhookStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      });

      if (!webhookEntity) {
        this.logger.error(`Failed to create webhook entity`, WebhookService.name);
        throw new NotFoundException(ErrorWebhook.NotCreated);
      }

      this.logger.log(
        `Created new webhook for escrow ${dto.escrowAddress} on chain ${dto.chainId}`,
        WebhookService.name,
      );

      return true;
    } catch (e) {
      this.logger.error(`createIncomingWebhook error: ${e.message}`, e);
      throw e;
    }
  }

  /**
   * Processes pending webhooks. Validates and processes incoming data,
   * then sends payments based on the processing results.
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  public async processPendingWebhooks(): Promise<void> {
    try {
      const webhookEntities = await this.webhookRepository.find(
        {
          status: WebhookStatus.PENDING,
          retriesCount: LessThanOrEqual(RETRIES_COUNT_THRESHOLD),
          waitUntil: LessThanOrEqual(new Date()),
        },
        {
          order: {
            waitUntil: SortDirection.ASC,
          },
        },
      );

      if (!webhookEntities.length) {
        this.logger.log(`No pending webhooks found`, WebhookService.name);
        return;
      }

      this.logger.log(
        `Found ${webhookEntities.length} pending webhooks to process`,
        WebhookService.name,
      );

      for (const webhookEntity of webhookEntities) {
        try {
          const { chainId, escrowAddress } = webhookEntity;
          const signer = this.web3Service.getSigner(chainId);
          const escrowClient = await EscrowClient.build(signer);

          this.logger.log(
            `Processing webhook ID ${webhookEntity.id} | Escrow: ${escrowAddress} | Chain: ${chainId}`,
            WebhookService.name,
          );

          const intermediateResultsUrl =
            await escrowClient.getIntermediateResultsUrl(escrowAddress);

          if (!intermediateResultsUrl) {
            throw new Error('Intermediate result URL not found');
          }

          // Attempt to download and parse intermediate results
          let intermediateResultContent;
          try {
            intermediateResultContent = await this.storageService.download(
              intermediateResultsUrl,
            );
          } catch (downloadErr) {
            this.logger.warn(
              `Failed to download intermediate results: ${downloadErr.message}`,
              WebhookService.name,
            );
            intermediateResultContent = null;
          }
          if (!intermediateResultContent) {
            throw new Error('Invalid intermediate results (empty content)');
          }

          let intermediateResults: LiquidityDto[];
          try {
            intermediateResults = JSON.parse(intermediateResultContent);
          } catch (parseErr) {
            throw new Error(`Invalid JSON in intermediate results: ${parseErr}`);
          }

          if (!Array.isArray(intermediateResults) || !intermediateResults.length) {
            throw new Error('No liquidity providers found in intermediate results');
          }

          // Upload results to storage (for example, as "proof" or record)
          const { url, hash } = await this.storageService.uploadLiquidities(
            escrowAddress,
            chainId,
            intermediateResults,
          );

          // Summarize recipients
          const recipients = this.getRecipients(intermediateResults);
          this.logger.debug(`Recipients: ${JSON.stringify(recipients)}`, WebhookService.name);

          // Check how much the contract has
          const totalAmount = await escrowClient.getBalance(escrowAddress);
          this.logger.debug(`Escrow contract balance: ${totalAmount.toString()}`, WebhookService.name);

          if (totalAmount === 0n) {
            throw new Error('No funds to distribute in escrow');
          }

          // Get manifest and relevant info
          const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
          const fundToken = await escrowClient.getTokenAddress(escrowAddress);

          let manifest: any;
          try {
            const response = await lastValueFrom(this.httpService.get(manifestUrl));
            manifest = response.data;
          } catch (manifestErr) {
            throw new Error(`Failed to download or parse manifest: ${manifestErr.message}`);
          }

          // 1) Compute totalVolume from intermediate results
          const totalVolume = intermediateResults.reduce((total, item) => {
            // Attempt to parse "liquidityScore" as a number or string that parseEther can handle
            return total + ethers.parseEther(item.liquidityScore);
          }, 0n);

          // 2) Possibly override daily amount if there's a volume-based calculation
          let amountForDay = this.getTotalAmountByVolume(
            chainId,
            manifest,
            fundToken,
            totalVolume,
          );

          if (amountForDay) {
            if (totalAmount < amountForDay) {
              amountForDay = totalAmount;
            }
          } else {
            // fallback if no volume-based approach
            const endBlock = manifest.endBlock;
            let remainingDays = Math.floor(
              (endBlock - Math.floor(Date.now() / 1000)) / 86400,
            );
            if (remainingDays < 1) {
              remainingDays = 1;
            }
            amountForDay = totalAmount / BigInt(remainingDays);
          }

          // 3) Calculate each user's portion
          const amounts = this.calculateCampaignPayoutAmounts(amountForDay, intermediateResults);

          // Double-check that sum(amounts) <= totalAmount
          const sumOfAmounts = amounts.reduce((acc, val) => acc + val, 0n);
          if (sumOfAmounts > totalAmount) {
            throw new Error(
              `Calculated payout total (${sumOfAmounts.toString()}) exceeds escrow balance (${totalAmount.toString()})`,
            );
          }

          this.logger.debug(
            `Computed individual amounts: ${JSON.stringify(
              amounts.map((bn) => bn.toString()),
            )}`,
            WebhookService.name,
          );

          // Prepare gas price
          const gasPrice = await this.web3Service.calculateGasPrice(chainId);
          this.logger.debug(`Calculated gas price: ${gasPrice.toString()}`, WebhookService.name);

          // 4) Save the web3 transaction record BEFORE making the on-chain call
          //    Capture the returned transaction ID for later updates
          const newTx = await this.web3TransactionService.saveWeb3Transaction({
            chainId,
            contract: 'escrow',
            address: escrowAddress,
            method: 'bulkPayOut',
            data: [
              recipients,
              amounts,
              url,
              hash,
              1,
              false,
              {
                gasPrice,
              },
            ],
            status: Web3TransactionStatus.PENDING,
          });

          // 5) Attempt the actual transaction
          try {
            await escrowClient.bulkPayOut(
              escrowAddress,
              recipients,
              amounts,
              url,
              hash,
              1,
              false,
              {
                gasPrice,
              },
            );

            // If we get here, transaction succeeded
            this.logger.log(
              `Successfully paid out campaign: chainId=${chainId}, escrow=${escrowAddress}`,
              WebhookService.name,
            );

            await this.web3TransactionService.updateWeb3TransactionStatus(
              newTx.id,
              Web3TransactionStatus.SUCCESS,
            );

            // Mark the webhook as "PAID"
            await this.webhookRepository.updateOne(
              { id: webhookEntity.id },
              {
                resultsUrl: url,
                checkPassed: true,
                status: WebhookStatus.PAID,
              },
            );
          } catch (txErr) {
            // Mark the web3 transaction as FAILED
            this.logger.error(
              `Failed to payout on-chain: ${txErr.message}`,
              txErr.stack,
            );

            await this.web3TransactionService.updateWeb3TransactionStatus(
              newTx.id,
              Web3TransactionStatus.FAILED,
            );

            throw new Error(
              `Failed to payout campaign: chainId=${chainId}, escrow=${escrowAddress}; original error: ${txErr.message}`,
            );
          }
        } catch (e) {
          // If any error occurs, handle retries & logging
          await this.handleWebhookError(webhookEntity, e);
        }
      }
    } catch (outerErr) {
      // Catch any outer error from the job itself
      this.logger.error(
        `processPendingWebhooks encountered an error: ${outerErr.message}`,
        outerErr.stack,
      );
    }
  }

  /**
   * Retrieves the recipients based on the final results.
   * @param finalResults - The final results array of LiquidityDto
   */
  private getRecipients(finalResults: LiquidityDto[]): string[] {
    return finalResults.map((item) => item.liquidityProvider);
  }

  /**
   * Calculates distribution amounts for each liquidity provider
   * @param totalAmount The total amount to distribute (as a bigint)
   * @param results An array of LiquidityDto with liquidityScore
   */
  public calculateCampaignPayoutAmounts(
    totalAmount: bigint,
    results: LiquidityDto[],
  ): bigint[] {
    // Convert liquidityScore to BigInt using parseEther for consistent scaling
    const bigNumberResults = results.map((result) => ({
      ...result,
      liquidityScore: ethers.parseEther(result.liquidityScore),
    }));

    // Sum total liquidity
    const totalLiquidityScore = bigNumberResults.reduce(
      (acc, item) => acc + item.liquidityScore,
      0n,
    );

    if (totalLiquidityScore === 0n) {
      // Edge case: if no liquidity, then everyone gets 0
      return new Array(bigNumberResults.length).fill(0n);
    }

    // Pro-rate each item based on liquidityScore
    return bigNumberResults.map((result) => {
      return (totalAmount * result.liquidityScore) / totalLiquidityScore;
    });
  }

  /**
   * Handles errors that occur during webhook processing. It logs the error,
   * and based on retry count, updates the webhook status accordingly.
   * @param webhookEntity The entity representing the webhook data.
   * @param error The error object thrown during processing.
   */
  public async handleWebhookError(
    webhookEntity: WebhookIncomingEntity,
    error: any,
  ): Promise<boolean> {
    // Log the full error
    this.logger.error(
      `Webhook ID ${webhookEntity.id} encountered an error: ${error.message}`,
      error.stack,
    );

    // Retry or mark as FAILED
    if (webhookEntity.retriesCount >= RETRIES_COUNT_THRESHOLD) {
      this.logger.warn(
        `Max retry count reached for webhook ID ${webhookEntity.id}. Marking as FAILED.`,
      );
      await this.webhookRepository.updateOne(
        { id: webhookEntity.id },
        { status: WebhookStatus.FAILED },
      );
    } else {
      this.logger.warn(
        `Retrying webhook ID ${webhookEntity.id}. Current retry count: ${webhookEntity.retriesCount}`,
      );
      await this.webhookRepository.updateOne(
        { id: webhookEntity.id },
        {
          retriesCount: webhookEntity.retriesCount + 1,
          waitUntil: new Date(), // immediate retry or set a future time
        },
      );
    }

    return false; // Indicate we hit an error
  }

  /**
   * Compute totalAmount by trading volume, if applicable
   * @param chainId
   * @param manifest
   * @param token
   * @param totalVolume
   */
  private getTotalAmountByVolume(
    chainId: ChainId,
    manifest: any,
    token: string,
    totalVolume: bigint,
  ): bigint | null {
    // Example logic for “xin/usdt” in the manifest
    if (manifest?.token?.toLowerCase() === 'xin/usdt') {
      // Example: 100 USDT for 100K volume, so 1 USDT for each 1K volume
      // USDT decimals = 6, so parseUnits("100", 6) => 100 USDT
      let amount: bigint;

      // If the token is USDT
      if (
        token.toLowerCase() === USDT_CONTRACT_ADDRESS[chainId].toLowerCase()
      ) {
        amount = ethers.parseUnits('100', 6); // 100 USDT with 6 decimals
      }
      // If the token is HMT
      else if (
        token.toLowerCase() === NETWORKS[chainId].hmtAddress.toLowerCase()
      ) {
        // For demonstration, 1 HMT = 0.025 USDT => 100 USDT => ~4000 HMT
        amount = ethers.parseUnits('4000', 18);
      } else {
        return null;
      }

      // The ratio for 100,000 volume
      // e.g., “(amount for 100K volume) * (actual volume) / (100K)”
      return (amount * totalVolume) / ethers.parseEther('100000');
    }

    // Return null if no special volume-based logic
    return null;
  }
}
