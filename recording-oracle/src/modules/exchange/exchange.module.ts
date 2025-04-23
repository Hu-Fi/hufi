import { Module } from '@nestjs/common';

import { Web3ConfigService } from '../../common/config/web3-config.service';

import { CCXTService } from './ccxt.service';

@Module({
  providers: [Web3ConfigService, CCXTService],
  exports: [CCXTService],
})
export class ExchangeModule {}
