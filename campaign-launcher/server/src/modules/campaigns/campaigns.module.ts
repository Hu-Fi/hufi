import { Module } from '@nestjs/common';

import { Web3Module } from '@/modules/web3';

import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [Web3Module],
  providers: [CampaignsService],
  controllers: [CampaignsController],
  exports: [CampaignsService],
})
export class CampaignModule {}
