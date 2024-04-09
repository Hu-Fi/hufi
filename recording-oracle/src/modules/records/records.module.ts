import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Campaign } from '../../common/entities/campaign.entity';
import { LiquidityScore } from '../../common/entities/liquidity-score.entity';
import { User } from '../../common/entities/user.entity';

import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, LiquidityScore, User])],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
