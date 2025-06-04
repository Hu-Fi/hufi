import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthConfigService } from './auth-config.service';
import { DatabaseConfigService } from './database-config.service';
import { ServerConfigService } from './server-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AuthConfigService, DatabaseConfigService, ServerConfigService],
  exports: [AuthConfigService, DatabaseConfigService, ServerConfigService],
})
export class EnvConfigModule {}
