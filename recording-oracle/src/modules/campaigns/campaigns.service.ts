import { EscrowClient, EscrowStatus, EscrowUtils } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';

import logger from '@/logger';
import {
  ExchangeApiKeyNotFoundError,
  ExchangeApiKeysRepository,
} from '@/modules/exchange-api-keys';
import { Web3Service } from '@/modules/web3';
import { downloadCampaignManifest } from '@/utils/manifest';

import { CampaignEntity } from './campaign.entity';
import {
  CampaignNotFoundError,
  InvalidCampaignStatusError,
  InvalidManifestError,
} from './campaigns.errors';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignManifest, CampaignStatus } from './types';
import { UserCampaignEntity } from './user-campaign.entity';
import { UserCampaignsRepository } from './user-campaigns.repository';

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
  ) {}

  async join(
    userId: string,
    chainId: number,
    campaignAddress: string,
  ): Promise<string> {
    let campaign =
      await this.campaignsRepository.findOneByAddress(campaignAddress);

    // Create a new campaign if it does not exist
    if (!campaign) {
      const escrow = await EscrowUtils.getEscrow(chainId, campaignAddress);
      if (!escrow) {
        throw new CampaignNotFoundError(campaignAddress);
      }

      const signer = this.web3Service.getSigner(chainId);
      const escrowClient = await EscrowClient.build(signer);
      const escrowStatus = await escrowClient.getStatus(campaignAddress);

      if (
        [EscrowStatus.Cancelled, EscrowStatus.Complete].includes(escrowStatus)
      ) {
        throw new InvalidCampaignStatusError(
          campaignAddress,
          EscrowStatus[escrowStatus],
        );
      }
      let manifest: CampaignManifest;
      try {
        manifest = await downloadCampaignManifest(escrow.manifestUrl as string);
      } catch (error) {
        this.logger.error('Campaign manifest error', error);
        throw new InvalidManifestError(
          campaignAddress,
          error.message as string,
        );
      }

      campaign = await this.createCampaign(chainId, campaignAddress, manifest);
    }

    const existingUserCampaign =
      await this.userCampaignsRepository.findOneByUserIdAndCampaignId(
        userId,
        campaign.id,
      );
    if (existingUserCampaign) {
      return existingUserCampaign.campaignId;
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
    newCampaign.chainId = chainId;
    newCampaign.address = address;
    newCampaign.exchangeName = manifest.exchange;
    newCampaign.pair = manifest.pair;
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
}
