import { Module } from '@nestjs/common';

import { Web3ConfigService } from '../../common/config/web3-config.service';

import { CCXTService } from './ccxt.service';
import { UniswapService } from './uniswap.service';

@Module({
  providers: [Web3ConfigService, CCXTService, UniswapService],
  exports: [CCXTService, UniswapService],
})
export class ExchangeModule {}
