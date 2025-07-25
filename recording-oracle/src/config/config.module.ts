import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AbuseConfigService } from './abuse-config.service';
import { AuthConfigService } from './auth-config.service';
import { DatabaseConfigService } from './database-config.service';
import { EncryptionConfigService } from './encryption-config.service';
import { ExchangeConfigService } from './exchange-config.service';
import { S3ConfigService } from './s3-config-service';
import { ServerConfigService } from './server-config.service';
import { Web3ConfigService } from './web3-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    AbuseConfigService,
    AuthConfigService,
    DatabaseConfigService,
    EncryptionConfigService,
    ExchangeConfigService,
    S3ConfigService,
    ServerConfigService,
    Web3ConfigService,
  ],
  exports: [
    AbuseConfigService,
    AuthConfigService,
    DatabaseConfigService,
    EncryptionConfigService,
    ExchangeConfigService,
    S3ConfigService,
    ServerConfigService,
    Web3ConfigService,
  ],
})
export class EnvConfigModule {}
