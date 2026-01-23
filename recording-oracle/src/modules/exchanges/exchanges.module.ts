import { Module } from '@nestjs/common';

import { UsersModule } from '@/modules/users';

import { ExchangeApiClientModule } from './api-client';
import { ExchangeApiKeysModule } from './exchange-api-keys';
import { ExchangesService } from './exchanges.service';

@Module({
  imports: [ExchangeApiClientModule, ExchangeApiKeysModule, UsersModule],
  providers: [ExchangesService],
  exports: [ExchangesService],
})
export class ExchangesModule {}
