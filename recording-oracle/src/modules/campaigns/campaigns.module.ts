import { Module } from '@nestjs/common';

import { ExchangeModule } from '@/modules/exchange';
import { ExchangeApiKeysModule } from '@/modules/exchange-api-keys';
import { Web3Module } from '@/modules/web3';

import { CampaignsController } from './campaigns.controller';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import { MarketMakingResultsChecker } from './progress-checkers';
import { UserCampaignsRepository } from './user-campaigns.repository';

@Module({
  imports: [ExchangeModule, ExchangeApiKeysModule, Web3Module],
  providers: [
    CampaignsRepository,
    CampaignsService,
    UserCampaignsRepository,
    MarketMakingResultsChecker,
  ],
  controllers: [CampaignsController],
  exports: [],
})
export class CampaignsModule {}
