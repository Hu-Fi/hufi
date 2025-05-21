import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { Web3Service } from '../web3/web3.service';

import { Web3TransactionRepository } from './web3-transaction.repository';
import { Web3TransactionService } from './web3-transaction.service';

@Module({
  imports: [DatabaseModule],
  providers: [Web3Service, Web3TransactionRepository, Web3TransactionService],
  exports: [Web3TransactionRepository, Web3TransactionService],
})
export class Web3TransactionModule {}
