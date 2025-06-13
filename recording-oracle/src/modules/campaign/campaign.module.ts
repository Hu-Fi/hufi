import { Module } from '@nestjs/common';

import { ExchangeApiKeysModule } from '@/modules/exchange-api-keys';
import { Web3Module } from '@/modules/web3';

import { CampaignController } from './campaign.controller';
import { CampaignRepository } from './campaign.repository';
import { CampaignService } from './campaign.service';
import { UserCampaignRepository } from './user-campaign.repository';

@Module({
  controllers: [CampaignController],
  imports: [ExchangeApiKeysModule, Web3Module],
  providers: [CampaignRepository, CampaignService, UserCampaignRepository],
  exports: [CampaignRepository, CampaignService, UserCampaignRepository],
})
export class CampaignModule {}
