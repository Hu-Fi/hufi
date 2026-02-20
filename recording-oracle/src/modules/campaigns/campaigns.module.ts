import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import { CacheModule } from '@/infrastructure/cache';
import { ExchangesModule } from '@/modules/exchanges';
import { StorageModule } from '@/modules/storage';
import { Web3Module } from '@/modules/web3';

import { CampaignEntity } from './campaign.entity';
import { CampaignsCache } from './campaigns-cache';
import { CampaignsController } from './campaigns.controller';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import { UserCampaignEntity } from './user-campaign.entity';
import { UserCampaignsRepository } from './user-campaigns.repository';
import { VolumeStatEntity } from './volume-stat.entity';
import { VolumeStatsRepository } from './volume-stats.repository';

@Module({
  imports: [
    CacheModule.register({ namespace: 'campaigns' }),
    ExchangesModule,
    StorageModule,
    TypeOrmModule.forFeature([
      CampaignEntity,
      UserCampaignEntity,
      VolumeStatEntity,
    ]),
    Web3Module,
  ],
  providers: [
    CampaignsCache,
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
