import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ServerConfigService } from './server-config.service';
import { Web3ConfigService } from './web3-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ServerConfigService, Web3ConfigService],
  exports: [ServerConfigService, Web3ConfigService],
})
export class EnvConfigModule {}
