import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RedisConfigService } from './redis-config.service';
import { ServerConfigService } from './server-config.service';
import { Web3ConfigService } from './web3-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisConfigService, ServerConfigService, Web3ConfigService],
  exports: [RedisConfigService, ServerConfigService, Web3ConfigService],
})
export class EnvConfigModule {}
