import { Module } from '@nestjs/common';

import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import { ExchangeModule } from '@/modules/exchange';
import { ExchangeApiKeysModule } from '@/modules/exchange-api-keys';
import { StorageModule } from '@/modules/storage';
import { UsersRepository } from '@/modules/users';
import { Web3Module } from '@/modules/web3';

import { CampaignsController } from './campaigns.controller';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import { UserCampaignsRepository } from './user-campaigns.repository';
import { VolumeStatsRepository } from './volume-stats.repository';

@Module({
  imports: [ExchangeModule, ExchangeApiKeysModule, StorageModule, Web3Module],
  providers: [
    CampaignsRepository,
    CampaignsService,
    UserCampaignsRepository,
    UsersRepository,
    VolumeStatsRepository,
    PgAdvisoryLock,
  ],
  controllers: [CampaignsController],
  exports: [
    CampaignsRepository,
    CampaignsService,
    VolumeStatsRepository,
    UserCampaignsRepository,
  ],
})
export class CampaignsModule {}
