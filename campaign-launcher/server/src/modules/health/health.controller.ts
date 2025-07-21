import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import Environment from '@/common/utils/environment';
import { ServerConfigService } from '@/config';

import { PingResponseDto } from './dto/ping-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly serverConfigService: ServerConfigService) {}

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
}
