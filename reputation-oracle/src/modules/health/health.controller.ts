import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get server health status' })
  @ApiResponse({ status: 200, description: 'Server health', type: String })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getHealth() {
    return this.healthService.getHealth();
  }
}
