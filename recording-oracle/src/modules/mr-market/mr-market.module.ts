import { Module } from '@nestjs/common';

import { CampaignModule } from '../campaign/campaign.module';
import { UserModule } from '../user/user.module';

import { MrMarketController } from './mr-market.controller';
import { MrMarketService } from './mr-market.service';

@Module({
  imports: [CampaignModule, UserModule],
  providers: [MrMarketService],
  controllers: [MrMarketController],
  exports: [MrMarketService],
})
export class MrMarketModule {}
