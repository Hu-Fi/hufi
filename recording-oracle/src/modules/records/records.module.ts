import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';
import { Web3Module } from '../web3/web3.module';

import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  imports: [Web3Module, StorageModule, HttpModule],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
