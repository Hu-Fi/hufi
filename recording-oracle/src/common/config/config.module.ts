import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ServerConfigService } from './server-config.service';

@Global()
@Module({
  providers: [ConfigService, ServerConfigService],
  exports: [ConfigService, ServerConfigService],
})
export class EnvConfigModule {}
