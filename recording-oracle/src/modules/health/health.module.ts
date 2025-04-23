import { Module } from '@nestjs/common';

import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';

import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [StorageService, Web3Service],
})
export class HealthModule {}
