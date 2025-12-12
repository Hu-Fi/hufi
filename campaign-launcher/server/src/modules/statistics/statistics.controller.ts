import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LRUCache } from 'lru-cache';

import { CampaignsStatsDto, GetCampaignsStatsQueryDto } from './statistics.dto';
import { StatisticsService } from './statistics.service';

const statsCache = new LRUCache({
  ttl: 1000 * 60 * 1,
  max: 4200,
  ttlAutopurge: false,
  allowStale: false,
  noDeleteOnStaleGet: false,
  noUpdateTTL: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

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
    const cacheKey = `get-campaigns-stats-${chainId}`;

    if (!statsCache.has(cacheKey)) {
      const result = await this.statisticsService.getCampaignsStats(chainId);

      const cachedValue: CampaignsStatsDto = {
        nActiveCampaigns: result.nActive,
        rewardsPoolUsd: result.rewardsPoolUsd,
        nCompletedCampaigns: result.nCompleted,
        paidRewardsUsd: result.paidRewardsUsd,
      };

      statsCache.set(cacheKey, cachedValue);
    }

    return statsCache.get(cacheKey) as CampaignsStatsDto;
  }
}
