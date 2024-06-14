import { Module } from '@nestjs/common';

import { PGPConfigService } from '../../common/config/pgp-config.service';
import { CampaignModule } from '../campaign/campaign.module';
import { Web3Service } from '../web3/web3.service';

import { ExchangeAPIKeyRepository } from './exchange-api-key.repository';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [CampaignModule],
  providers: [
    UserService,
    UserRepository,
    Web3Service,
    ExchangeAPIKeyRepository,
    PGPConfigService,
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
