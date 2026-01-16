import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CampaignsStatsDto, GetCampaignsStatsQueryDto } from './statistics.dto';
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Controller('stats')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @ApiOperation({
    summary: 'Get campaigns stats',
  })
  @ApiResponse({
    status: 200,
    type: CampaignsStatsDto,
  })
  @Header('Cache-Control', 'public, max-age=60')
  @Get('/campaigns')
  async getCampaignsStats(
    @Query() { chainId }: GetCampaignsStatsQueryDto,
  ): Promise<CampaignsStatsDto> {
    const result = await this.statisticsService.getCampaignsStats(chainId);

    return {
      nActiveCampaigns: result.nActive,
      rewardsPoolUsd: result.rewardsPoolUsd,
      nFinishedCampaigns: result.nFinished,
      paidRewardsUsd: result.paidRewardsUsd,
    };
  }
}
