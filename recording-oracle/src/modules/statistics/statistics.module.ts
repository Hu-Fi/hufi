import { Module } from '@nestjs/common';

import { CampaignsModule } from '@/modules/campaigns';

import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [CampaignsModule],
  providers: [StatisticsService],
  controllers: [StatisticsController],
  exports: [],
})
export class StatisticsModule {}
