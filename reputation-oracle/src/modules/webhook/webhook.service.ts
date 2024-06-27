import { EscrowClient } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { lastValueFrom } from 'rxjs';
import { LessThanOrEqual } from 'typeorm';

import { RETRIES_COUNT_THRESHOLD } from '../../common/constants';
import { ErrorWebhook } from '../../common/constants/errors';
import { EventType, SortDirection, WebhookStatus } from '../../common/enums';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';

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
   * @param webhookEntity The entity representing the webhook data.
   * @throws {Error} Will throw an error if processing fails at any step.
   */
  public async processPendingWebhooks(): Promise<void> {
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
          `Escrow address: ${escrowAddress}`,
          WebhookService.name,
        );

        const intermediateResultsUrl =
          await escrowClient.getIntermediateResultsUrl(escrowAddress);

        if (!intermediateResultsUrl) {
          throw new Error('Intermediate result not found');
        }

        let intermediateResultContent;
        try {
          intermediateResultContent = await this.storageService.download(
            intermediateResultsUrl,
          );
        } catch {
          intermediateResultContent = null;
        }
        if (!intermediateResultContent) {
          throw new Error('Invalid intermediate results');
        }

        let intermediateResults;
        try {
          intermediateResults = JSON.parse(intermediateResultContent);
        } catch {
          intermediateResults = null;
        }
        if (!intermediateResults) {
          throw new Error('Invalid intermediate results');
        }

        const { url, hash } = await this.storageService.uploadLiquidities(
          escrowAddress,
          chainId,
          intermediateResults,
        );

        const recipients = this.getRecipients(intermediateResults);
        const totalAmount = await escrowClient.getBalance(escrowAddress);

        if (totalAmount === 0n) {
          throw new Error('No funds to distribute');
        }

        const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
        const response = await lastValueFrom(this.httpService.get(manifestUrl));
        const manifest = response.data;

        const endBlock = manifest.endBlock;
        const remainingDays = Math.floor(
          (endBlock - Math.floor(Date.now() / 1000)) / 86400,
        );
        const amountForDay = totalAmount / BigInt(remainingDays);

        const amounts = this.calculateCampaignPayoutAmounts(
          amountForDay,
          intermediateResults,
        );

        this.logger.log(`Recipients: ${recipients}, Amounts: ${amounts}`);

        await escrowClient.bulkPayOut(
          escrowAddress,
          recipients,
          amounts,
          url,
          hash,
        );

        await this.webhookRepository.updateOne(
          { id: webhookEntity.id },
          {
            resultsUrl: url,
            checkPassed: true,
            status: WebhookStatus.PAID,
          },
        );
      } catch (e) {
        await this.handleWebhookError(webhookEntity, e);
      }
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

  public calculateCampaignPayoutAmounts(
    totalAmount: bigint,
    results: LiquidityDto[],
  ): bigint[] {
    // Convert the liquidity scores to BigNumber for precision in calculations.
    const bigNumberResults = results.map((result) => ({
      ...result,
      liquidityScore: ethers.parseEther(result.liquidityScore),
    }));

    // Calculate the total liquidity score as a BigNumber.
    const totalLiquidityScore = bigNumberResults.reduce(
      (total, item) => total + item.liquidityScore,
      0n,
    );

    // Map through each result, calculate each recipient's payout, and return the array.
    const payouts = bigNumberResults.map(
      (result) => (totalAmount * result.liquidityScore) / totalLiquidityScore,
    );

    return payouts;
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
      'An error occurred during webhook validation: ',
      error,
      WebhookService.name,
    );
    return false;
  }
}
