import { Module } from '@nestjs/common';

import { ExchangesController } from './exchanges.controller';
import { ExchangesService } from './exchanges.service';

@Module({
  controllers: [ExchangesController],
  providers: [ExchangesService],
})
export class ExchangesModule {}
