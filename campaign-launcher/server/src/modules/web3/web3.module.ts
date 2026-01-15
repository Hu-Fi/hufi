import { Module } from '@nestjs/common';

import { CacheModule } from '@/infrastructure/cache';

import { Web3Cache } from './web3-cache';
import { Web3Controller } from './web3.controller';
import { Web3Service } from './web3.service';

@Module({
  imports: [CacheModule.register({ namespace: 'web3' })],
  providers: [Web3Cache, Web3Service],
  controllers: [Web3Controller],
  exports: [Web3Service],
})
export class Web3Module {}
