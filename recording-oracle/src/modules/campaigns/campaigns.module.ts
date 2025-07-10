import { Module } from '@nestjs/common';

import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import { ExchangeModule } from '@/modules/exchange';
import { ExchangeApiKeysModule } from '@/modules/exchange-api-keys';
import { StorageModule } from '@/modules/storage';
import { Web3Module } from '@/modules/web3';

import { CampaignsController } from './campaigns.controller';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import { MarketMakingResultsChecker } from './progress-checkers';
import { UserCampaignsRepository } from './user-campaigns.repository';

@Module({
  imports: [ExchangeModule, ExchangeApiKeysModule, StorageModule, Web3Module],
  providers: [
    CampaignsRepository,
    CampaignsService,
    UserCampaignsRepository,
    MarketMakingResultsChecker,
    PgAdvisoryLock,
  ],
  controllers: [CampaignsController],
  exports: [],
})
export class CampaignsModule {}
