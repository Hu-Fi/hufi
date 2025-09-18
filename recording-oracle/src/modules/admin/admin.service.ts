import { Injectable } from '@nestjs/common';

import { CampaignsService } from '@/modules/campaigns';

import { CheckCampaignProgressDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly campaignsService: CampaignsService) {}

  async checkCampaignProgress({
    chainId,
    address,
    fromDate,
    toDate,
  }: CheckCampaignProgressDto) {
    const campaign = await this.campaignsService.findOneByChainIdAndAddress(
      chainId,
      address,
    );
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const progress = await this.campaignsService.checkCampaignProgressForPeriod(
      campaign,
      new Date(fromDate),
      new Date(toDate),
    );

    return {
      from: progress.from,
      to: progress.to,
      totalVolume: progress.total_volume,
      participantOutcomes: progress.participants_outcomes,
    };
  }
}
