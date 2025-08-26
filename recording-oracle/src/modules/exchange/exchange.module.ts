import { Module } from '@nestjs/common';

import { ExchangeApiClientFactory } from './exchange-api-client-factory';

@Module({
  imports: [],
  providers: [ExchangeApiClientFactory],
  exports: [ExchangeApiClientFactory],
})
export class ExchangeModule {}
