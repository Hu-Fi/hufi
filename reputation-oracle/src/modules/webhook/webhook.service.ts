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
   * @throws {Error} - An error object if an error occurred.
   */
  public async createIncomingWebhook(
    dto: WebhookIncomingDto,
  ): Promise<boolean> {
    try {
      if (dto.eventType !== EventType.CAMPAIGN_PAYOUT) {
        this.logger.log(ErrorWebhook.InvalidEventType, WebhookService.name);
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
        this.logger.log(ErrorWebhook.NotCreated, WebhookService.name);
        throw new NotFoundException(ErrorWebhook.NotCreated);
      }

      return true;
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * Processes a pending webhook. Validates and processes incoming data,
   * then sends payments based on the processing results.
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  public async processPendingWebhooks(): Promise<void> {
    try {
      // Find all webhook entries that are still pending, haven't exceeded retries, and are due for processing.
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

      for (const webhookEntity of webhookEntities) {
        try {
          const { chainId, escrowAddress } = webhookEntity;
          const signer = this.web3Service.getSigner(chainId);
          const escrowClient = await EscrowClient.build(signer);

          this.logger.log(
            `Processing escrow address: ${escrowAddress}`,
            WebhookService.name,
          );

          // Get the intermediateResultsUrl from the escrow
          const intermediateResultsUrl =
            await escrowClient.getIntermediateResultsUrl(escrowAddress);

          if (!intermediateResultsUrl) {
            throw new Error('Intermediate result URL not found');
          }

          // Attempt to download and parse intermediate results
          let intermediateResultContent: string | null;
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
            throw new Error(
              `Invalid JSON in intermediate results: ${parseErr}`,
            );
          }

          if (
            !Array.isArray(intermediateResults) ||
            !intermediateResults.length
          ) {
            throw new Error(
              'No liquidity providers found - intermediate results array is empty or invalid',
            );
          }

          // Upload results (for example, as "proof" or record)
          const { url, hash } = await this.storageService.uploadLiquidities(
            escrowAddress,
            chainId,
            intermediateResults,
          );

          const recipientsOriginal = this.getRecipients(intermediateResults);

          // Check how much the contract has
          const totalAmount = await escrowClient.getBalance(escrowAddress);
          this.logger.debug(
            `Escrow contract balance: ${totalAmount.toString()}`,
            WebhookService.name,
          );

          if (totalAmount === 0n) {
            throw new Error('No funds to distribute in escrow');
          }

          // Get manifest and relevant info
          const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
          const fundToken = await escrowClient.getTokenAddress(escrowAddress);

          let manifest: any;
          try {
            const response = await lastValueFrom(
              this.httpService.get(manifestUrl),
            );
            manifest = response.data;
          } catch (manifestErr) {
            throw new Error(
              `Failed to download or parse manifest: ${manifestErr.message}`,
            );
          }

          // 1) Compute totalVolume from intermediate results
          const totalVolume = intermediateResults.reduce((acc, item) => {
            return acc + ethers.parseEther(item.liquidityScore);
          }, 0n);

          // 2) Possibly override daily amount if there's a volume-based calculation
          let amountForDay = this.getTotalAmountByVolume(
            chainId,
            manifest,
            fundToken,
            totalVolume,
          );

          if (amountForDay) {
            // If the escrow has less than that daily amount, just use the entire escrow
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
          const amountsOriginal = this.calculateCampaignPayoutAmounts(
            amountForDay,
            intermediateResults,
          );

          // filter out zero amount payouts
          const filtered = recipientsOriginal
            .map((addr, i) => ({ addr, amt: amountsOriginal[i] }))
            .filter(({ amt }) => amt > 0n);

          if (filtered.length === 0) {
            this.logger.warn(
              'No non-zero payouts, skipping bulkPayOut',
              WebhookService.name,
            );
            await this.webhookRepository.updateOne(
              { id: webhookEntity.id },
              { checkPassed: true, status: WebhookStatus.PAID },
            );
            continue;
          }

          const recipients = filtered.map(({ addr }) => addr);
          const amounts = filtered.map(({ amt }) => amt);

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
          this.logger.debug(
            `Calculated gas price: ${gasPrice.toString()}`,
            WebhookService.name,
          );

          // Convert BigInts to strings before saving Web3Transaction to avoid JSON issues
          const amountsAsStrings = amounts.map((a) => a.toString());
          const gasPriceString = gasPrice.toString();

          // 4) Save the web3 transaction record BEFORE making the on-chain call
          const newTx = await this.web3TransactionService.saveWeb3Transaction({
            chainId,
            contract: 'escrow',
            address: escrowAddress,
            method: 'bulkPayOut',
            data: [
              recipients,
              amountsAsStrings,
              url,
              hash,
              1,
              false,
              { gasPrice: gasPriceString },
            ],
            status: Web3TransactionStatus.PENDING,
          });

          // 5) Attempt the actual transaction on-chain
          await escrowClient.bulkPayOut(
            escrowAddress,
            recipients,
            amounts,
            url,
            hash,
            1,
            false,
            { gasPrice },
          );

          // If we reach here, transaction succeeded
          this.logger.log(
            `Successfully paid out campaign: chainId=${chainId}, escrow=${escrowAddress}`,
            WebhookService.name,
          );
          await this.web3TransactionService.updateWeb3TransactionStatus(
            newTx.id,
            Web3TransactionStatus.SUCCESS,
          );

          // Mark the webhook as paid
          await this.webhookRepository.updateOne(
            { id: webhookEntity.id },
            {
              resultsUrl: url,
              checkPassed: true,
              status: WebhookStatus.PAID,
            },
          );
        } catch (err) {
          // If any error occurs, handle retries & logging
          await this.handleWebhookError(webhookEntity, err);
        }
      }
    } catch (outerErr) {
      // Catch any outer error from the cron job itself
      this.logger.error(
        `processPendingWebhooks encountered an error: ${outerErr.message}`,
        outerErr.stack,
      );
    }
  }

  /**
   * Retrieves the recipients based on the final results and request type.
   * @param finalResults - The final results.
   * @returns {string[]} - Returns an array of recipient addresses.
   */
  private getRecipients(finalResults: LiquidityDto[]): string[] {
    return finalResults.map((item) => item.liquidityProvider);
  }

  /**
   * Given a total payout amount and an array of liquidity result objects,
   * calculates how much each provider gets based on their liquidityScore.
   */
  public calculateCampaignPayoutAmounts(
    totalAmount: bigint,
    results: LiquidityDto[],
  ): bigint[] {
    // Convert liquidityScore to BigInt using parseEther
    const bigNumberResults = results.map((result) => ({
      ...result,
      liquidityScore: ethers.parseEther(result.liquidityScore),
    }));

    // Calculate total liquidity score
    const totalLiquidityScore = bigNumberResults.reduce(
      (sum, item) => sum + item.liquidityScore,
      0n,
    );

    if (totalLiquidityScore === 0n) {
      // Edge case: if no liquidity at all, everyone gets zero
      return new Array(bigNumberResults.length).fill(0n);
    }

    // Map through each result to calculate each recipient's payout
    return bigNumberResults.map(
      (result) => (totalAmount * result.liquidityScore) / totalLiquidityScore,
    );
  }

  /**
   * Handles errors that occur during webhook processing. It logs the error,
   * and based on retry count, updates the webhook status accordingly.
   * @param webhookEntity The entity representing the webhook data.
   * @param error The error object thrown during processing.
   * @returns {Promise<boolean>} Returns false indicating that an error occurred.
   */
  public async handleWebhookError(
    webhookEntity: WebhookIncomingEntity,
    error: any,
  ): Promise<boolean> {
    if (webhookEntity.retriesCount >= RETRIES_COUNT_THRESHOLD) {
      await this.webhookRepository.updateOne(
        { id: webhookEntity.id },
        { status: WebhookStatus.FAILED },
      );
    } else {
      await this.webhookRepository.updateOne(
        { id: webhookEntity.id },
        {
          retriesCount: webhookEntity.retriesCount + 1,
          waitUntil: new Date(),
        },
      );
    }

    this.logger.error(
      'An error occurred during webhook validation:',
      error,
      WebhookService.name,
    );
    return false;
  }

  /**
   * For certain campaigns, calculates how much to pay out in total each day based on volume.
   * Example: If manifest says “xin/usdt” and your token is indeed USDT or HMT,
   * implement logic to convert the totalVolume of liquidity into a daily payout.
   */
  private getTotalAmountByVolume(
    chainId: ChainId,
    manifest: any,
    token: string,
    totalVolume: bigint,
  ): bigint | null {
    if (manifest?.token?.toLowerCase() === 'xin/usdt') {
      // Example: 100 USDT for 100K volume => 1 USDT per 1K volume

      let amount: bigint;

      if (
        token.toLowerCase() === USDT_CONTRACT_ADDRESS[chainId].toLowerCase()
      ) {
        // 100 USDT in 6 decimals
        amount = ethers.parseUnits('100', 6);
      } else if (
        token.toLowerCase() === NETWORKS[chainId].hmtAddress.toLowerCase()
      ) {
        // For demonstration, assume 1 HMT = ~0.025 USDT => 100 USDT => ~4000 HMT
        amount = ethers.parseUnits('4000', 18);
      } else {
        return null;
      }

      // Scale the “amount” according to totalVolume over 100,000
      return (amount * totalVolume) / ethers.parseEther('100000');
    }

    return null;
  }
}
