import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { S3ConfigService } from './s3-config-service';
import { ServerConfigService } from './server-config.service';
import { Web3ConfigService } from './web3-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [S3ConfigService, ServerConfigService, Web3ConfigService],
  exports: [S3ConfigService, ServerConfigService, Web3ConfigService],
})
export class EnvConfigModule {}
