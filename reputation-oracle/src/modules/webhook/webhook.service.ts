import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EscrowClient, EscrowUtils } from '@human-protocol/sdk';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookIncomingDto, LiquidityDto } from './webhook.dto';
import { ErrorWebhook } from '../../common/constants/errors';
import { WebhookRepository } from './webhook.repository';
import { RETRIES_COUNT_THRESHOLD } from '../../common/constants';
import { BigNumber } from '@ethersproject/bignumber';
import { Web3Service } from '../web3/web3.service';
import { EventType, SortDirection, WebhookStatus } from '../../common/enums';
import { LessThanOrEqual } from 'typeorm';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  constructor(
    private readonly web3Service: Web3Service,
    @Inject(StorageService)
    private readonly storageService: StorageService,
    private readonly webhookRepository: WebhookRepository,
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
  public async processPendingCronJob(): Promise<boolean> {
    const webhookEntity = await this.webhookRepository.findOne(
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

    if (!webhookEntity) return false;

    try {
      const { chainId, escrowAddress } = webhookEntity;
      const signer = this.web3Service.getSigner(chainId);
      const escrowClient = await EscrowClient.build(signer);

      const intermediateResultsUrl =
        await escrowClient.getIntermediateResultsUrl(escrowAddress);
      const intermediateResults: LiquidityDto[] = JSON.parse(
        await this.storageService.download(intermediateResultsUrl),
      );
      const { url, hash } = await this.storageService.uploadLiquidities(
        escrowAddress,
        chainId,
        intermediateResults,
      );

      const recipients = this.getRecipients(intermediateResults);
      const totalAmount = await escrowClient.getBalance(escrowAddress);
      const amounts = this.calculateCampaignPayoutAmounts(
        BigNumber.from(totalAmount),
        intermediateResults,
      );

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

      return true;
    } catch (e) {
      return await this.handleWebhookError(webhookEntity, e);
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
    totalAmount: BigNumber,
    results: LiquidityDto[],
  ): bigint[] {
    // Convert the liquidity scores to BigNumber for precision in calculations.
    const bigNumberResults = results.map((result) => ({
      ...result,
      liquidityScore: BigNumber.from(result.liquidityScore),
    }));

    // Calculate the total liquidity score as a BigNumber.
    const totalLiquidityScore = bigNumberResults.reduce(
      (total, item) => total.add(item.liquidityScore),
      BigNumber.from(0),
    );

    // Map through each result, calculate each recipient's payout, and return the array.
    const payouts = bigNumberResults.map((result) => {
      const participantScore = result.liquidityScore;
      const participantPercentage = participantScore.div(totalLiquidityScore);
      return BigInt(totalAmount.mul(participantPercentage).toString());
    });

    return payouts;
  }

  public convertBigNumberToBigInt(bigNumberArray: BigNumber[]): bigint[] {
    return bigNumberArray.map((bn) => BigInt(bn.toString()));
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

  /**
   * Processing a webhook of an entity with a paid status.
   * @returns {Promise<boolean>} - Return the boolean result of the method.
   * @throws {Error} - An error object if an error occurred.
   */
  public async processPaidCronJob(): Promise<boolean> {
    const webhookEntity = await this.webhookRepository.findOne(
      {
        status: WebhookStatus.PAID,
        retriesCount: LessThanOrEqual(RETRIES_COUNT_THRESHOLD),
        waitUntil: LessThanOrEqual(new Date()),
      },
      {
        order: {
          waitUntil: SortDirection.ASC,
        },
      },
    );

    if (!webhookEntity) return false;

    try {
      const signer = this.web3Service.getSigner(webhookEntity.chainId);
      const escrowClient = await EscrowClient.build(signer);

      const escrow = await EscrowUtils.getEscrow(
        webhookEntity.chainId,
        webhookEntity.escrowAddress,
      );

      if (escrow.finalResultsUrl) {
        const balance = BigNumber.from(escrow.balance);
        if (balance.isZero()) {
          await escrowClient.complete(webhookEntity.escrowAddress);
        }
        await this.webhookRepository.updateOne(
          {
            id: webhookEntity.id,
          },
          { status: WebhookStatus.COMPLETED },
        );
      }

      return true;
    } catch (e) {
      return await this.handleWebhookError(webhookEntity, e);
    }
  }
}