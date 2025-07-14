import { EscrowUtils } from '@human-protocol/sdk';
import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorCampaign } from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';
import { CampaignEntity } from '../../database/entities';

import { CampaignCreateRequestDto } from './campaign.dto';
import { CampaignRepository } from './campaign.repository';
@Injectable()
export class CampaignService {
  constructor(private campaignRepository: CampaignRepository) {}

  public async createCampaign(payload: CampaignCreateRequestDto) {
    if (
      await this.campaignRepository.findOneByChainIdAndAddress(
        payload.chainId,
        payload.address,
      )
    ) {
      throw new ControlledError(
        ErrorCampaign.AlreadyExists,
        HttpStatus.CONFLICT,
      );
    }

    return await this._createCampaign(payload.chainId, payload.address);
  }

  public async createCampaignIfNotExists(
    payload: CampaignCreateRequestDto,
  ): Promise<CampaignEntity> {
    const campaign = await this.campaignRepository.findOneByChainIdAndAddress(
      payload.chainId,
      payload.address,
    );

    if (campaign) {
      return campaign;
    }

    return await this._createCampaign(payload.chainId, payload.address);
  }

  public async getCampaign(chainId: number, address: string) {
    return await this.campaignRepository.findOneByChainIdAndAddress(
      chainId,
      address,
    );
  }

  public async getAllActiveCampaigns(): Promise<CampaignEntity[]> {
    const campaigns = await this.campaignRepository.findAll();

    const activeFlags = await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          const escrow = await EscrowUtils.getEscrow(
            campaign.chainId,
            campaign.address,
          );
          // “Active” if status is Pending or Partial
          return escrow.status === 'Pending' || escrow.status === 'Partial';
        } catch {
          // if the escrow call fails treat campaign as inactive
          return false;
        }
      }),
    );

    return campaigns.filter((_, idx) => activeFlags[idx]);
  }

  public async updateLastSyncedAt(campaign: CampaignEntity, date: Date) {
    campaign.lastSyncedAt = date;

    return await campaign.save();
  }

  private async _createCampaign(chainId: number, address: string) {
    const campaignDetails = await EscrowUtils.getEscrow(chainId, address);
    const campaignData = await fetch(campaignDetails.manifestUrl).then((res) =>
      res.json(),
    );

    const campaign = new CampaignEntity();
    campaign.chainId = chainId;
    campaign.address = address;

    if (!campaignData.exchangeName) {
      throw new ControlledError(
        ErrorCampaign.InvalidCampaignData,
        HttpStatus.BAD_REQUEST,
      );
    }
    campaign.exchangeName = campaignData.exchangeName;

    campaign.token = campaignData.token;
    campaign.startDate = new Date(
      Date.UTC(0, 0, campaignData.startBlock * 1000),
    );
    campaign.endDate = new Date(Date.UTC(0, 0, campaignData.endBlock * 1000));
    campaign.fundToken = campaignDetails.token;
    campaign.fundAmount = campaignData.fundAmount;
    campaign.lastSyncedAt = new Date(
      Date.UTC(0, 0, campaignData.startBlock * 1000),
    );

    return await this.campaignRepository.createUnique(campaign);
  }
}
