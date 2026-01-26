import { Injectable } from '@nestjs/common';

import {
  CampaignsRepository,
  VolumeStatsRepository,
  CampaignStatus,
} from '@/modules/campaigns';

import { CampaignsStatsDto } from './statistics.dto';

const inFlightPromisesCache = new Map<string, Promise<unknown>>();

@Injectable()
export class StatisticsService {
  constructor(
    private readonly campaignsRepository: CampaignsRepository,
    private readonly volumeStatsRepository: VolumeStatsRepository,
  ) {}

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

  async getCampaignsStats(exchangeName?: string): Promise<CampaignsStatsDto> {
    const cacheKey = `get-campaigns-stats-${exchangeName || 'all'}`;

    try {
      if (!inFlightPromisesCache.has(cacheKey)) {
        const campaignsStatsQuery = this.campaignsRepository
          .createQueryBuilder('campaign')
          .select('campaign.status', 'status')
          .addSelect('COUNT(*)', 'count');

        if (exchangeName) {
          campaignsStatsQuery.where('campaign.exchange_name = :exchangeName', {
            exchangeName,
          });
        }

        campaignsStatsQuery.groupBy('campaign.status');

        inFlightPromisesCache.set(cacheKey, campaignsStatsQuery.getRawMany());
      }

      const queryResult = (await inFlightPromisesCache.get(cacheKey)) as Array<{
        status: CampaignStatus;
        count: string;
      }>;

      const statusToCount: Map<CampaignStatus, number> = new Map();
      for (const { status, count } of queryResult) {
        statusToCount.set(status as CampaignStatus, Number(count));
      }

      const nCompleted = statusToCount.get(CampaignStatus.COMPLETED) || 0;
      const nCancelled = statusToCount.get(CampaignStatus.CANCELLED) || 0;

      const nFinished = nCompleted + nCancelled;

      return { nFinished, nCompleted, nCancelled };
    } finally {
      inFlightPromisesCache.delete(cacheKey);
    }
  }
}
