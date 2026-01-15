import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { ValkeyModule } from '@/infrastructure/valkey';

import { HealthController } from './health.controller';
import { ValkeyHealthIndicator } from './indicators/valkey.health';

@Module({
  imports: [TerminusModule.forRoot({ logger: false }), ValkeyModule],
  providers: [ValkeyHealthIndicator],
  controllers: [HealthController],
})
export class HealthModule {}
