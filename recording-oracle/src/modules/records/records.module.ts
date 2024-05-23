import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Campaign } from '../../common/entities/campaign.entity';
import { LiquidityScore } from '../../common/entities/liquidity-score.entity';
import { User } from '../../common/entities/user.entity';
import { StorageModule } from '../storage/storage.module';
import { Web3Module } from '../web3/web3.module';

import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, LiquidityScore, User]),
    Web3Module,
    StorageModule,
    HttpModule,
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
