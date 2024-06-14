import { Module } from '@nestjs/common';

import { CampaignController } from './campaign.controller';
import { CampaignRepository } from './campaign.repository';
import { CampaignService } from './campaign.service';

@Module({
  providers: [CampaignService, CampaignRepository],
  controllers: [CampaignController],
  exports: [CampaignService, CampaignRepository],
})
export class CampaignModule {}
