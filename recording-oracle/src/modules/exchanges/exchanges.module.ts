import { Module } from '@nestjs/common';

import { ExchangeApiClientModule } from './api-client';
import { ExchangeApiKeysModule } from './exchange-api-keys';
import { ExchangesService } from './exchanges.service';

@Module({
  imports: [ExchangeApiClientModule, ExchangeApiKeysModule],
  providers: [ExchangesService],
  exports: [ExchangesService],
})
export class ExchangesModule {}
