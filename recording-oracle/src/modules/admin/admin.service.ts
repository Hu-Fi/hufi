import { Injectable } from '@nestjs/common';

import {
  CampaignsRepository,
  CampaignsService,
  UserCampaignsRepository,
} from '@/modules/campaigns';

import { CheckCampaignProgressDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly campaignsRepository: CampaignsRepository,
    private readonly campaignsService: CampaignsService,
    private readonly userCampaignsRepository: UserCampaignsRepository,
  ) {}

  async checkCampaignProgress({
    chainId,
    address,
    fromDate,
    toDate,
  }: CheckCampaignProgressDto) {
    const campaign = await this.campaignsRepository.findOneByChainIdAndAddress(
      chainId,
      address,
    );
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const participants = await this.userCampaignsRepository.findCampaignUsers(
      campaign.id,
    );

    const progress = await this.campaignsService.checkCampaignProgressForPeriod(
      campaign,
      participants,
      new Date(fromDate),
      new Date(toDate),
    );

    return {
      from: progress.from,
      to: progress.to,
      totalVolume: progress.total_volume,
      participantOutcomes: progress.participants_outcomes_batches.flatMap(
        (batch) => batch.results,
      ),
    };
  }
}
