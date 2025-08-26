import { Module } from '@nestjs/common';

import { CampaignModule } from '@/modules/campaigns';
import { Web3Module } from '@/modules/web3';

import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [CampaignModule, Web3Module],
  providers: [StatisticsService],
  controllers: [StatisticsController],
  exports: [StatisticsService],
})
export class StatisticsModule {}
