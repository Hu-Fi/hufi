import { Module } from '@nestjs/common';

import { PGPConfigService } from '../../common/config/pgp-config.service';
import { CampaignModule } from '../campaign/campaign.module';
import { ExchangeModule } from '../exchange/exchange.module';
import { RecordsService } from '../records/records.service';
import { StorageService } from '../storage/storage.service';
import { ExchangeAPIKeyRepository } from '../user/exchange-api-key.repository';
import { Web3Service } from '../web3/web3.service';

import { LiquidityScoreController } from './liquidity-score.controller';
import { LiquidityScoreRepository } from './liquidity-score.repository';
import { LiquidityScoreService } from './liquidity-score.service';

@Module({
  imports: [CampaignModule, ExchangeModule],
  providers: [
    LiquidityScoreService,
    PGPConfigService,
    ExchangeAPIKeyRepository,
    RecordsService,
    Web3Service,
    StorageService,
    LiquidityScoreRepository,
  ],
  controllers: [LiquidityScoreController],
  exports: [LiquidityScoreService],
})
export class LiquidityScoreModule {}
