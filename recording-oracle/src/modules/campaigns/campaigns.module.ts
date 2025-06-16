import { Module } from '@nestjs/common';

import { ExchangeApiKeysModule } from '@/modules/exchange-api-keys';
import { Web3Module } from '@/modules/web3';

import { CampaignsController } from './campaigns.controller';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import { UserCampaignsRepository } from './user-campaigns.repository';

@Module({
  controllers: [CampaignsController],
  imports: [ExchangeApiKeysModule, Web3Module],
  providers: [CampaignsRepository, CampaignsService, UserCampaignsRepository],
  exports: [],
})
export class CampaignsModule {}
