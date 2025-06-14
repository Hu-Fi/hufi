import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../../database/database.module';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookIncomingEntity } from '../webhook/webhook-incoming.entity';
import { WebhookModule } from '../webhook/webhook.module';
import { WebhookRepository } from '../webhook/webhook.repository';

import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';

@Module({
  imports: [
    HttpModule,
    WebhookModule,
    TypeOrmModule.forFeature([WebhookIncomingEntity]),
    DatabaseModule,
  ],
  controllers: [PayoutController],
  providers: [PayoutService, StorageService, Web3Service, WebhookRepository],
  exports: [PayoutService],
})
export class PayoutModule {}
