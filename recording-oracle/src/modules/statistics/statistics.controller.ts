import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LRUCache } from 'lru-cache';

import { Public } from '@/common/decorators';

import {
  GetTotalVolumeQueryDto,
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
  @Header('Cache-Control', 'public, max-age=1800')
  @Get('/total-volume')
  async getTotalVolume(
    @Query() { exchangeName }: GetTotalVolumeQueryDto,
  ): Promise<GetTotalVolumeResponseDto> {
    const cacheKey = `get-total-volume-for-${exchangeName || 'all'}`;

    if (!statsCache.has(cacheKey)) {
      let totalVolume =
        await this.statisticsService.getTotalVolume(exchangeName);
      // Harcoded total volume from legacy hufi version
      totalVolume += 1024970.3547550276;

      statsCache.set(cacheKey, totalVolume);
    }

    return {
      totalVolume: statsCache.get(cacheKey) as number,
    };
  }
}
