import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { Web3Module } from '../web3/web3.module';
import { Web3TransactionModule } from '../web3-transaction/web3-transaction.module';
import { Web3TransactionService } from '../web3-transaction/web3-transaction.service';

import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookController } from './webhook.controller';
import { WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookIncomingEntity]),
    ConfigModule,
    Web3Module,
    StorageModule,
    HttpModule,
    Web3TransactionModule,
    DatabaseModule,
  ],
  controllers: [WebhookController],
  providers: [
    Logger,
    WebhookService,
    WebhookRepository,
    Web3TransactionService,
  ],
  exports: [WebhookService],
})
export class WebhookModule {}
