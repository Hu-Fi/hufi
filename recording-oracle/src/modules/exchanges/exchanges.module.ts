import { Module } from '@nestjs/common';

import { ExchangeApiClientModule } from './api-client';
import { ExchangeApiKeysModule } from './exchange-api-keys';

@Module({
  imports: [ExchangeApiClientModule, ExchangeApiKeysModule],
  exports: [ExchangeApiClientModule, ExchangeApiKeysModule],
})
export class ExchangesModule {}
