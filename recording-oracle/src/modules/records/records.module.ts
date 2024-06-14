import { Module } from '@nestjs/common';

import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';

import { RecordsService } from './records.service';

@Module({
  controllers: [],
  providers: [RecordsService, Web3Service, StorageService],
  exports: [RecordsService],
})
export class RecordsModule {}
