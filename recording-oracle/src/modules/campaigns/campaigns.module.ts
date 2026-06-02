import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PgAdvisoryLock } from '@/common/utils/pg-advisory-lock';
import { CacheModule } from '@/infrastructure/cache';
import { ExchangesModule } from '@/modules/exchanges';
import { NotificationsModule } from '@/modules/notifications';
import { StorageModule } from '@/modules/storage';
import { UsersModule } from '@/modules/users';
import { Web3Module } from '@/modules/web3';

import { AutojoinService } from './autojoin.service';
import { CampaignEntity } from './campaign.entity';
import { CampaignsCache } from './campaigns-cache';
import { CampaignsController } from './campaigns.controller';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import { ParticipationsModule } from './participations';
import { VolumeStatEntity } from './volume-stat.entity';
import { VolumeStatsRepository } from './volume-stats.repository';

@Module({
  imports: [
    CacheModule.register({ namespace: 'campaigns' }),
    ExchangesModule,
    ParticipationsModule,
    NotificationsModule,
    StorageModule,
    TypeOrmModule.forFeature([CampaignEntity, VolumeStatEntity]),
    UsersModule,
    Web3Module,
  ],
  providers: [
    AutojoinService,
    CampaignsCache,
    CampaignsRepository,
    CampaignsService,
    VolumeStatsRepository,
    PgAdvisoryLock,
  ],
  controllers: [CampaignsController],
  exports: [CampaignsRepository, CampaignsService, VolumeStatsRepository],
})
export class CampaignsModule {}
