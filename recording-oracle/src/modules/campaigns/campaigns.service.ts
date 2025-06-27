import crypto from 'crypto';

import { EscrowClient, EscrowStatus, EscrowUtils } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import type { CampaignManifest } from '@/common/types';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import {
  ExchangeApiKeyNotFoundError,
  ExchangeApiKeysRepository,
} from '@/modules/exchange-api-keys';
import { Web3Service } from '@/modules/web3';
import Environment from '@/utils/environment';
import { downloadCampaignManifest } from '@/utils/manifest';

import { CampaignEntity } from './campaign.entity';
import { CampaignNotFoundError, InvalidCampaign } from './campaigns.errors';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignStatus } from './types';
import { UserCampaignEntity } from './user-campaign.entity';
import { UserCampaignsRepository } from './user-campaigns.repository';

const PROGRESS_CHECK_SCHEDULE = Environment.isProduction()
  ? CronExpression.EVERY_DAY_AT_MIDNIGHT
  : CronExpression.EVERY_MINUTE;

@Injectable()
export class CampaignsService {
  private readonly logger = logger.child({
    context: CampaignsService.name,
  });
  constructor(
    private readonly campaignsRepository: CampaignsRepository,
    private readonly exchangeApiKeysRepository: ExchangeApiKeysRepository,
    private readonly userCampaignsRepository: UserCampaignsRepository,
    private readonly web3Service: Web3Service,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  async join(
    userId: string,
    chainId: number,
    campaignAddress: string,
  ): Promise<string> {
    let campaign = await this.campaignsRepository.findOneByChainIdAndAddress(
      chainId,
      campaignAddress,
    );

    // Create a new campaign if it does not exist
    if (!campaign) {
      const manifest = await this.retrieveCampaignManifest(
        chainId,
        campaignAddress,
      );
      campaign = await this.createCampaign(chainId, campaignAddress, manifest);
    }

    const isUserJoined =
      await this.userCampaignsRepository.checkUserJoinedCampaign(
        userId,
        campaign.id,
      );
    if (isUserJoined) {
      return campaign.id;
    }

    const exchangeApiKey =
      await this.exchangeApiKeysRepository.findOneByUserAndExchange(
        userId,
        campaign.exchangeName,
      );

    if (!exchangeApiKey) {
      throw new ExchangeApiKeyNotFoundError(userId, campaign.exchangeName);
    }

    const newUserCampaign = new UserCampaignEntity();
    newUserCampaign.userId = userId;
    newUserCampaign.campaignId = campaign.id;
    newUserCampaign.exchangeApiKeyId = exchangeApiKey.id;
    newUserCampaign.createdAt = new Date();

    await this.userCampaignsRepository.insert(newUserCampaign);

    return campaign.id;
  }

  async createCampaign(
    chainId: number,
    address: string,
    manifest: CampaignManifest,
  ): Promise<CampaignEntity> {
    const newCampaign = new CampaignEntity();
    newCampaign.id = crypto.randomUUID();
    newCampaign.chainId = chainId;
    newCampaign.address = address;
    newCampaign.exchangeName = manifest.exchange;
    newCampaign.pair = manifest.pair;
    newCampaign.lastResultsAt = null;
    newCampaign.startDate = manifest.start_date;
    newCampaign.endDate = manifest.end_date;
    newCampaign.status = CampaignStatus.ACTIVE;

    await this.campaignsRepository.insert(newCampaign);

    return newCampaign;
  }

  async getJoined(userId: string): Promise<string[]> {
    const userCampaigns = await this.userCampaignsRepository.findByUserId(
      userId,
      {
        relations: {
          campaign: true,
        },
      },
    );

    const result: string[] = [];
    for (const userCampaign of userCampaigns) {
      if (!userCampaign.campaign) {
        this.logger.error(`User campaign does not have associated campaign`, {
          userId,
          campaignId: userCampaign.campaignId,
        });
        continue;
      }
      result.push(userCampaign.campaign.address);
    }
    return result;
  }

  private async retrieveCampaignManifest(
    chainId: number,
    campaignAddress: string,
  ): Promise<CampaignManifest> {
    const escrow = await EscrowUtils.getEscrow(chainId, campaignAddress);
    if (!escrow) {
      throw new CampaignNotFoundError(campaignAddress);
    }

    const isEscrowForThisOracle =
      escrow.recordingOracle?.toLowerCase() ===
      this.web3ConfigService.operatorAddress.toLowerCase();

    if (!isEscrowForThisOracle) {
      throw new InvalidCampaign(
        campaignAddress,
        `Invalid recording oracle address: ${escrow.recordingOracle}`,
      );
    }

    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const escrowStatus = await escrowClient.getStatus(campaignAddress);

    if (
      [EscrowStatus.Cancelled, EscrowStatus.Complete].includes(escrowStatus)
    ) {
      throw new InvalidCampaign(
        campaignAddress,
        `Invalid status: ${EscrowStatus[escrowStatus]}`,
      );
    }

    try {
      const manifest = await downloadCampaignManifest(
        escrow.manifestUrl as string,
        escrow.manifestHash as string,
      );

      return manifest;
    } catch (error) {
      this.logger.error('Failed to download campaign manifest', error);
      throw new InvalidCampaign(campaignAddress, error.message as string);
    }
  }

  @Cron(PROGRESS_CHECK_SCHEDULE)
  async checkCampaignsProgress(): Promise<void> {
    this.logger.info('Campaigns progress check started');

    /**
     * Atm we don't expect many active campaigns
     * so it's fine to get all at once, but later
     * we might need to query them in batches or as stream.
     */
    const campaignsToCheck =
      await this.campaignsRepository.findForProgressCheck();

    for (const campaign of campaignsToCheck) {
      /**
       * Right now for simplicity process sequentially.
       * Later we can add "fastq" usage for parallel processing
       * and "backpressured" adding to the queue.
       */
      await this.checkCampaignProgress(campaign);
    }

    this.logger.info('Campaigns progress check finished');
  }

  async checkCampaignProgress(campaign: CampaignEntity): Promise<void> {
    const logger = this.logger.child({
      action: 'check-campaign-progress',
      campaignId: campaign.id,
    });
    logger.debug('Campaign progress check started');

    try {
      if (campaign.endDate < new Date()) {
        campaign.status = CampaignStatus.COMPLETED;
      }
      campaign.lastResultsAt = new Date();

      await this.campaignsRepository.save(campaign);
    } catch (error) {
      logger.error('Failure while checking campaign progress', error);
    } finally {
      logger.debug('Campaign progress check finished');
    }
  }
}
