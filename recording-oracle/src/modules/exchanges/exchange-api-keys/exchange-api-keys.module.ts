import { Module } from '@nestjs/common';

import { UserCampaignsRepository } from '@/modules/campaigns/user-campaigns.repository';
import { EncryptionModule } from '@/modules/encryption';
import { UsersModule } from '@/modules/users';

import { ExchangeApiClientModule } from '../api-client';
import { ExchangeApiKeysController } from './exchange-api-keys.controller';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeysService } from './exchange-api-keys.service';

@Module({
  imports: [ExchangeApiClientModule, EncryptionModule, UsersModule],
  providers: [
    ExchangeApiKeysRepository,
    ExchangeApiKeysService,
    UserCampaignsRepository,
  ],
  controllers: [ExchangeApiKeysController],
  exports: [ExchangeApiKeysService],
})
export class ExchangeApiKeysModule {}
