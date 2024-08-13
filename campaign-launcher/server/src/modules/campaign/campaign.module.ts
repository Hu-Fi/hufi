import { Module } from '@nestjs/common';

import { Web3Service } from '../web3/web3.service';

import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';

@Module({
  providers: [CampaignService, Web3Service],
  controllers: [CampaignController],
  exports: [CampaignService],
})
export class CampaignModule {}
