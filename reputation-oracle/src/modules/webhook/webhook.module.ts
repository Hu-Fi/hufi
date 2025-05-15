import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { Web3Module } from '../web3/web3.module';

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
    DatabaseModule,
  ],
  controllers: [WebhookController],
  providers: [Logger, WebhookService, WebhookRepository],
  exports: [WebhookService],
})
export class WebhookModule {}
