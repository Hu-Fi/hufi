import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ParticipationsModule } from '@/modules/campaigns/participations';
import { EncryptionModule } from '@/modules/encryption';
import { UsersModule } from '@/modules/users';

import { ExchangeApiClientModule } from '../api-client';
import { ExchangeApiKeyEntity } from './exchange-api-key.entity';
import { ExchangeApiKeysController } from './exchange-api-keys.controller';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeysService } from './exchange-api-keys.service';

@Module({
  imports: [
    ExchangeApiClientModule,
    EncryptionModule,
    ParticipationsModule,
    TypeOrmModule.forFeature([ExchangeApiKeyEntity]),
    UsersModule,
  ],
  providers: [ExchangeApiKeysRepository, ExchangeApiKeysService],
  controllers: [ExchangeApiKeysController],
  exports: [ExchangeApiKeysService],
})
export class ExchangeApiKeysModule {}
