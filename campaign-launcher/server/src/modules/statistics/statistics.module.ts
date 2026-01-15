import { Module } from '@nestjs/common';

import { CacheModule } from '@/infrastructure/cache';
import { CampaignModule } from '@/modules/campaigns';
import { Web3Module } from '@/modules/web3';

import { StatisticsCache } from './statistics-cache';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [
    CacheModule.register({ namespace: 'statistics' }),
    CampaignModule,
    Web3Module,
  ],
  providers: [StatisticsCache, StatisticsService],
  controllers: [StatisticsController],
  exports: [StatisticsService],
})
export class StatisticsModule {}
