import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthConfigService } from './auth-config.service';
import { DatabaseConfigService } from './database-config.service';
import { EncryptionConfigService } from './encryption-config.service';
import { ExchangeConfigService } from './exchange-config.service';
import { ServerConfigService } from './server-config.service';
import { Web3ConfigService } from './web3-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    AuthConfigService,
    DatabaseConfigService,
    EncryptionConfigService,
    ExchangeConfigService,
    ServerConfigService,
    Web3ConfigService,
  ],
  exports: [
    AuthConfigService,
    DatabaseConfigService,
    EncryptionConfigService,
    ExchangeConfigService,
    ServerConfigService,
    Web3ConfigService,
  ],
})
export class EnvConfigModule {}
