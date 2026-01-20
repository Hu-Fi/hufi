import { Module } from '@nestjs/common';

import { ExchangeNameValidator } from './web3';

@Module({
  providers: [ExchangeNameValidator],
  exports: [ExchangeNameValidator],
})
export class ValidatorsModule {}
