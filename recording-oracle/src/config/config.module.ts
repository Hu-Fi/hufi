import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseConfigService } from './database-config.service';
import { ServerConfigService } from './server-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DatabaseConfigService, ServerConfigService],
  exports: [DatabaseConfigService, ServerConfigService],
})
export class EnvConfigModule {}
