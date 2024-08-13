import { Module } from '@nestjs/common';

import { Web3Service } from '../web3/web3.service';

import { LeaderController } from './leader.controller';
import { LeaderService } from './leader.service';

@Module({
  providers: [LeaderService, Web3Service],
  controllers: [LeaderController],
  exports: [LeaderService],
})
export class LeaderModule {}
