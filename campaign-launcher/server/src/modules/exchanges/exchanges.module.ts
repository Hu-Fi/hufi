import { Module } from '@nestjs/common';

import { CacheModule } from '@/infrastructure/cache';

import { ExchangesCache } from './exchanges-cache';
import { ExchangesController } from './exchanges.controller';
import { ExchangesService } from './exchanges.service';

@Module({
  imports: [CacheModule.register({ namespace: 'exchanges' })],
  providers: [ExchangesCache, ExchangesService],
  controllers: [ExchangesController],
})
export class ExchangesModule {}
