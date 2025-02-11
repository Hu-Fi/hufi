import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { Web3TransactionModule } from '../web3-transaction/web3-transaction.module';
import { WebhookIncomingEntity } from '../webhook/webhook-incoming.entity';
import { WebhookModule } from '../webhook/webhook.module';
import { WebhookRepository } from '../webhook/webhook.repository';
import { WebhookService } from '../webhook/webhook.service';

import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';

@Module({
  imports: [
    HttpModule,
    WebhookModule,
    TypeOrmModule.forFeature([WebhookIncomingEntity]),
    Web3TransactionModule,
  ],
  controllers: [PayoutController],
  providers: [
    PayoutService,
    StorageService,
    Web3Service,
    WebhookRepository,
    WebhookService,
  ],
  exports: [PayoutService],
})
export class PayoutModule {}
