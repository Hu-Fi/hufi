import { Module } from '@nestjs/common';

import { RedisModule } from '@/infrastructure/redis';

import { Web3Cache } from './web3-cache';
import { Web3Controller } from './web3.controller';
import { Web3Service } from './web3.service';

@Module({
  imports: [RedisModule],
  providers: [Web3Cache, Web3Service],
  controllers: [Web3Controller],
  exports: [Web3Service],
})
export class Web3Module {}
