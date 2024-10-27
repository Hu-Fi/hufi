import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NetworkConfigService } from './network-config.service';
import { S3ConfigService } from './s3-config.service';
import { ServerConfigService } from './server-config.service';
import { Web3ConfigService } from './web3-config.service';

@Global()
@Module({
  providers: [
    ConfigService,
    ServerConfigService,
    S3ConfigService,
    Web3ConfigService,
    NetworkConfigService,
  ],
  exports: [
    ConfigService,
    ServerConfigService,
    S3ConfigService,
    Web3ConfigService,
    NetworkConfigService,
  ],
})
export class EnvConfigModule {}
