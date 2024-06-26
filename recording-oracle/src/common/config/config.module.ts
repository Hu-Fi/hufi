import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthConfigService } from './auth-config.service';
import { DatabaseConfigService } from './database-config.service';
import { NetworkConfigService } from './network-config.service';
import { S3ConfigService } from './s3-config.service';
import { ServerConfigService } from './server-config.service';
import { Web3ConfigService } from './web3-config.service';

@Global()
@Module({
  providers: [
    ConfigService,
    AuthConfigService,
    DatabaseConfigService,
    NetworkConfigService,
    S3ConfigService,
    ServerConfigService,
    Web3ConfigService,
  ],
  exports: [
    ConfigService,
    AuthConfigService,
    DatabaseConfigService,
    NetworkConfigService,
    S3ConfigService,
    ServerConfigService,
    Web3ConfigService,
  ],
})
export class EnvConfigModule {}
