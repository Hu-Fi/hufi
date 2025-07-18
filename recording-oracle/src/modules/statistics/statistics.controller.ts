import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '@/common/decorators';

import { StatisticsService } from './statistics.service';

@Public()
@ApiTags('Statistics')
@Controller('/stats')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('/total-volume')
  @ApiOperation({
    summary: 'Get total generated volume',
    description:
      'Returns total volume generated in all campaigns by all participants',
  })
  @ApiResponse({
    status: 200,
    description: 'Total volume returned successfully',
  })
  async getTotalVolume(): Promise<unknown> {
    const totalVolume = await this.statisticsService.getTotalVolume();

    return { totalVolume };
  }
}
