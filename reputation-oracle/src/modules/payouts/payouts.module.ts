import { Module } from '@nestjs/common';

import { StorageModule } from '@/modules/storage';
import { Web3Module } from '@/modules/web3';

import { PayoutsService } from './payouts.service';

@Module({
  imports: [StorageModule, Web3Module],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutModule {}
