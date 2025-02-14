import { Module } from '@nestjs/common';

import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { Web3TransactionModule } from '../web3-transaction/web3-transaction.module';

import { RecordsService } from './records.service';

@Module({
  imports: [Web3TransactionModule],
  controllers: [],
  providers: [RecordsService, Web3Service, StorageService],
  exports: [RecordsService],
})
export class RecordsModule {}
