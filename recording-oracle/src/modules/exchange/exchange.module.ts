import { Module } from '@nestjs/common';

import { CCXTService } from './ccxt.service';
import { UniswapService } from './uniswap.service';

@Module({
  providers: [CCXTService, UniswapService],
  exports: [CCXTService, UniswapService],
})
export class ExchangeModule {}
