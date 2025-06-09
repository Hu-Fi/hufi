import { Module } from '@nestjs/common';

import { EncryptionModule } from '@/modules/encryption';
import { ExchangeModule } from '@/modules/exchange/exchange.module';
import { UsersModule } from '@/modules/users';

import { ExchangeApiKeysController } from './exchange-api-keys.controller';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeysService } from './exchange-api-keys.service';

@Module({
  imports: [ExchangeModule, EncryptionModule, UsersModule],
  providers: [ExchangeApiKeysRepository, ExchangeApiKeysService],
  controllers: [ExchangeApiKeysController],
  exports: [],
})
export class ExchangeApiKeysModule {}
