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
    NetworkConfigService,
    ServerConfigService,
    S3ConfigService,
    Web3ConfigService,
  ],
  exports: [
    ConfigService,
    NetworkConfigService,
    ServerConfigService,
    S3ConfigService,
    Web3ConfigService,
  ],
})
export class EnvConfigModule {}
