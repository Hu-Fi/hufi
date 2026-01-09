import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthConfigService } from './auth-config.service';
import { CacheConfigService } from './cache-config.service';
import { CampaignsConfigService } from './campaigns-config.service';
import { DatabaseConfigService } from './database-config.service';
import { EncryptionConfigService } from './encryption-config.service';
import { ExchangeConfigService } from './exchange-config.service';
import { LoggingConfigService } from './logging-config.service';
import { S3ConfigService } from './s3-config-service';
import { ServerConfigService } from './server-config.service';
import { Web3ConfigService } from './web3-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    AuthConfigService,
    CacheConfigService,
    CampaignsConfigService,
    DatabaseConfigService,
    EncryptionConfigService,
    ExchangeConfigService,
    LoggingConfigService,
    S3ConfigService,
    ServerConfigService,
    Web3ConfigService,
  ],
  exports: [
    AuthConfigService,
    CampaignsConfigService,
    CacheConfigService,
    DatabaseConfigService,
    EncryptionConfigService,
    ExchangeConfigService,
    LoggingConfigService,
    S3ConfigService,
    ServerConfigService,
    Web3ConfigService,
  ],
})
export class EnvConfigModule {}
