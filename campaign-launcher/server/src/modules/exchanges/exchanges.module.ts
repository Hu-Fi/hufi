import { Module } from '@nestjs/common';

import { RedisModule } from '@/infrastructure/redis';

import { ExchangesCache } from './exchanges-cache';
import { ExchangesController } from './exchanges.controller';
import { ExchangesService } from './exchanges.service';

@Module({
  imports: [RedisModule],
  providers: [ExchangesCache, ExchangesService],
  controllers: [ExchangesController],
})
export class ExchangesModule {}
