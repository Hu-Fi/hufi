import { EscrowUtils } from '@human-protocol/sdk';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { ErrorCampaign } from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';
import { CampaignEntity } from '../../database/entities';

import { CampaignCreateRequestDto } from './campaign.dto';
import { CampaignRepository } from './campaign.repository';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(private readonly campaignRepo: CampaignRepository) {}

  async createCampaign(payload: CampaignCreateRequestDto) {
    const addr = payload.address.toLowerCase();

    if (
      await this.campaignRepo.findOneByChainIdAndAddress(payload.chainId, addr)
    ) {
      throw new ControlledError(
        ErrorCampaign.AlreadyExists,
        HttpStatus.CONFLICT,
      );
    }
    return this._createCampaign(payload.chainId, addr);
  }

  async createCampaignIfNotExists(
    payload: CampaignCreateRequestDto,
  ): Promise<CampaignEntity> {
    const addr = payload.address.toLowerCase();
    const existing = await this.campaignRepo.findOneByChainIdAndAddress(
      payload.chainId,
      addr,
    );
    return existing ?? this._createCampaign(payload.chainId, addr);
  }

  async getCampaign(chainId: number, address: string) {
    return this.campaignRepo.findOneByChainIdAndAddress(
      chainId,
      address.toLowerCase(),
    );
  }

  async getAllActiveCampaigns() {
    /* active == endDate is in the future */
    const now = new Date();
    return (await this.campaignRepo.findAll()).filter(
      (c) => c.endDate > now && c.lastSyncedAt < c.endDate,
    );
  }

  async updateLastSyncedAt(campaign: CampaignEntity, at: Date) {
    campaign.lastSyncedAt = at;
    return campaign.save();
  }

  private async _createCampaign(chainId: number, address: string) {
    let details;
    try {
      details = await EscrowUtils.getEscrow(chainId, address);
    } catch (err) {
      this.logger.error(
        `Escrow fetch failed for ${chainId}:${address}`,
        err as any,
      );
      throw new ControlledError(
        ErrorCampaign.InvalidCampaignData,
        HttpStatus.BAD_REQUEST,
      );
    }

    const manifest = await fetch(details.manifestUrl).then((r) => r.json());

    if (!manifest.exchangeName) {
      throw new ControlledError(
        ErrorCampaign.InvalidCampaignData,
        HttpStatus.BAD_REQUEST,
      );
    }

    const c = new CampaignEntity();
    c.chainId = chainId;
    c.address = address;
    c.exchangeName = manifest.exchangeName.toLowerCase();
    c.token = manifest.token;
    c.startDate = new Date(manifest.startBlock * 1000);
    c.endDate = new Date(manifest.endBlock * 1000);
    c.fundToken = details.token;
    c.fundAmount = manifest.fundAmount;
    c.lastSyncedAt = c.startDate;

    return this.campaignRepo.createUnique(c);
  }
}
