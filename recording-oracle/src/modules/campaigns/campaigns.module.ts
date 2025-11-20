import { Module } from '@nestjs/common';

import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import { ExchangesModule } from '@/modules/exchanges';
import { StorageModule } from '@/modules/storage';
import { Web3Module } from '@/modules/web3';

import { CampaignsController } from './campaigns.controller';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import { UserCampaignsRepository } from './user-campaigns.repository';
import { VolumeStatsRepository } from './volume-stats.repository';

@Module({
  imports: [ExchangesModule, StorageModule, Web3Module],
  providers: [
    CampaignsRepository,
    CampaignsService,
    UserCampaignsRepository,
    VolumeStatsRepository,
    PgAdvisoryLock,
  ],
  controllers: [CampaignsController],
  exports: [CampaignsRepository, CampaignsService, VolumeStatsRepository],
})
export class CampaignsModule {}
