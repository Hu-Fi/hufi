import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LRUCache } from 'lru-cache';

import { Public } from '@/common/decorators';

import {
  CampaignsStatsDto,
  ExchangeQueryDto,
  GetTotalVolumeResponseDto,
} from './statistics.dto';
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

@Public()
@ApiTags('Statistics')
@Controller('/stats')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @ApiOperation({
    summary: 'Get total generated volume',
    description:
      'Returns total volume generated in all campaigns by all participants',
  })
  @ApiResponse({
    status: 200,
    description: 'Total volume returned successfully',
    type: GetTotalVolumeResponseDto,
  })
  @Header('Cache-Control', 'public, max-age=300')
  @Get('/total-volume')
  async getTotalVolume(
    @Query() { exchangeName }: ExchangeQueryDto,
  ): Promise<GetTotalVolumeResponseDto> {
    const cacheKey = `get-total-volume-for-${exchangeName || 'all'}`;

    if (!statsCache.has(cacheKey)) {
      const totalVolume =
        await this.statisticsService.getTotalVolume(exchangeName);

      statsCache.set(cacheKey, totalVolume);
    }

    return {
      totalVolume: statsCache.get(cacheKey) as number,
    };
  }

  @ApiOperation({
    summary: 'Get campaigns stats',
    description: 'Returns various statistics about campaigns',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaigns stats',
    type: CampaignsStatsDto,
  })
  @Header('Cache-Control', 'public, max-age=300')
  @Get('/campaigns')
  async getCampaignsStats(
    @Query() { exchangeName }: ExchangeQueryDto,
  ): Promise<CampaignsStatsDto> {
    const cacheKey = `get-campaigns-stats-${exchangeName || 'all'}`;

    if (!statsCache.has(cacheKey)) {
      const stats =
        await this.statisticsService.getCampaignsStats(exchangeName);

      statsCache.set(cacheKey, stats);
    }

    return statsCache.get(cacheKey) as CampaignsStatsDto;
  }
}
