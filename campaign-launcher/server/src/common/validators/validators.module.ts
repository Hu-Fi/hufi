import { Module } from '@nestjs/common';

import { ExchangeNameValidator } from './exchanges';

@Module({
  providers: [ExchangeNameValidator],
  exports: [ExchangeNameValidator],
})
export class ValidatorsModule {}
