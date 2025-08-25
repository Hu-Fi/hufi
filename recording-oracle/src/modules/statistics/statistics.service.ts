import { Injectable } from '@nestjs/common';

import { VolumeStatsRepository } from '@/modules/campaigns';

const inFlightPromisesCache = new Map<string, Promise<unknown>>();

@Injectable()
export class StatisticsService {
  constructor(private readonly volumeStatsRepository: VolumeStatsRepository) {}

  async getTotalVolume(exchangeName?: string): Promise<number> {
    const cacheKey = `get-total-volume-${exchangeName || 'all'}`;

    try {
      if (!inFlightPromisesCache.has(cacheKey)) {
        const totalVolumeQuery = this.volumeStatsRepository
          .createQueryBuilder('stat')
          .select('COALESCE(SUM(stat.volume_usd), 0)', 'totalVolume');

        if (exchangeName) {
          totalVolumeQuery.where('stat.exchange_name = :exchangeName', {
            exchangeName,
          });
        }

        inFlightPromisesCache.set(cacheKey, totalVolumeQuery.getRawOne());
      }

      const queryResult = (await inFlightPromisesCache.get(cacheKey)) as {
        totalVolume: string;
      };

      return Number(queryResult.totalVolume);
    } finally {
      inFlightPromisesCache.delete(cacheKey);
    }
  }
}
