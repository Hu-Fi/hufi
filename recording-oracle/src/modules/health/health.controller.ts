import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { Public } from '@/common/decorators';
import Environment from '@/common/utils/environment';
import { ServerConfigService } from '@/config';
import {
  VALKEY_CACHE_CLIENT,
  type ValkeyClient,
} from '@/infrastructure/valkey';

import { PingResponseDto } from './dto/ping-response.dto';
import { ValkeyHealthIndicator } from './indicators/valkey.health';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly serverConfigService: ServerConfigService,
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly valkey: ValkeyHealthIndicator,
    @Inject(VALKEY_CACHE_CLIENT)
    private readonly valkeyCacheClient: ValkeyClient,
  ) {}

  @ApiOperation({
    summary: 'Service ping',
    description:
      'Endpoint to ping service via HTTP in order to make sure it is accesible and serves proper version',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is reachable',
    type: PingResponseDto,
  })
  @ApiResponse({
    status: '5XX',
    description: 'Service is not reachable/running',
  })
  @Get('/ping')
  async ping(): Promise<PingResponseDto> {
    return {
      nodeEnv: Environment.name,
      gitHash: this.serverConfigService.gitHash,
    };
  }

  @ApiOperation({
    summary: 'Health check',
    description: 'Endpoint to perform health checks for the application.',
  })
  @HealthCheck()
  @Get('/check')
  check() {
    return this.health.check([
      async () => this.db.pingCheck('database', { timeout: 5000 }),
      async () => this.valkey.isHealthy('cache-client', this.valkeyCacheClient),
    ]);
  }
}
