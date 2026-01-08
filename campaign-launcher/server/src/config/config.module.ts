import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CacheConfigService } from './cache-config.service';
import { ServerConfigService } from './server-config.service';
import { Web3ConfigService } from './web3-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CacheConfigService, ServerConfigService, Web3ConfigService],
  exports: [CacheConfigService, ServerConfigService, Web3ConfigService],
})
export class EnvConfigModule {}
