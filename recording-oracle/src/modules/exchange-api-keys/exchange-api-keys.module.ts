import { Module } from '@nestjs/common';

import { UserCampaignsRepository } from '@/modules/campaigns/user-campaigns.repository';
import { EncryptionModule } from '@/modules/encryption';
import { ExchangeModule } from '@/modules/exchange';
import { UsersModule } from '@/modules/users';

import { ExchangeApiKeysController } from './exchange-api-keys.controller';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeysService } from './exchange-api-keys.service';

@Module({
  imports: [ExchangeModule, EncryptionModule, UsersModule],
  providers: [
    ExchangeApiKeysRepository,
    ExchangeApiKeysService,
    UserCampaignsRepository,
  ],
  controllers: [ExchangeApiKeysController],
  exports: [ExchangeApiKeysRepository, ExchangeApiKeysService],
})
export class ExchangeApiKeysModule {}
