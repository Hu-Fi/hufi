import { Module } from '@nestjs/common';

import { ExchangeController } from './exchange.controller';
import { ExchangeService } from './exchange.service';

@Module({
  providers: [ExchangeService],
  controllers: [ExchangeController],
  exports: [ExchangeService],
})
export class ExchangeModule {}
