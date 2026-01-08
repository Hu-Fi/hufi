import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';

import { CacheManager } from '@/infrastructure/cache';

enum StatisticsDataKey {
  COMPLETED_CAMPAIGNS = 'completed_campaigns',
  ACTIVE_CAMPAIGNS = 'active_campaigns',
  TOTAL_REWARDS = 'total_rewards',
}

type CompletedCampaignsStats = {
  nCompleted: number;
};

type TotalRewardsStats<T> = {
  paidRewardsUsd: number;
  lastCheckedBlock: T;
};

export type ActiveCampaignsStats = {
  nActive: number;
  rewardsPoolUsd: number;
};

@Injectable()
export class StatisticsCache {
  constructor(private readonly cacheManager: CacheManager) {}

  async getCompletedCampaignsStats(
    chainId: number,
  ): Promise<CompletedCampaignsStats | null> {
    const cacheKey = CacheManager.makeCacheKey([
      chainId,
      StatisticsDataKey.COMPLETED_CAMPAIGNS,
    ]);

    const stats = await this.cacheManager.get<string>(cacheKey);

    if (!stats) {
      return null;
    }

    return JSON.parse(stats) as CompletedCampaignsStats;
  }

  async setCompletedCampaignsStats(
    chainId: number,
    stats: CompletedCampaignsStats,
  ): Promise<void> {
    const cacheKey = CacheManager.makeCacheKey([
      chainId,
      StatisticsDataKey.COMPLETED_CAMPAIGNS,
    ]);

    await this.cacheManager.set(
      cacheKey,
      JSON.stringify(stats),
      dayjs.duration(1, 'hour').asMilliseconds(),
    );
  }

  async getTotalRewardsStats(
    chainId: number,
  ): Promise<TotalRewardsStats<bigint> | null> {
    const cacheKey = CacheManager.makeCacheKey([
      chainId,
      StatisticsDataKey.TOTAL_REWARDS,
    ]);

    const stats = await this.cacheManager.get<string>(cacheKey);

    if (!stats) {
      return null;
    }

    const parsedStats = JSON.parse(stats) as TotalRewardsStats<string>;

    return {
      paidRewardsUsd: parsedStats.paidRewardsUsd,
      lastCheckedBlock: BigInt(parsedStats.lastCheckedBlock),
    } as TotalRewardsStats<bigint>;
  }

  async setTotalRewardsStats(
    chainId: number,
    stats: TotalRewardsStats<bigint>,
  ): Promise<void> {
    const cacheKey = CacheManager.makeCacheKey([
      chainId,
      StatisticsDataKey.TOTAL_REWARDS,
    ]);

    await this.cacheManager.set(
      cacheKey,
      JSON.stringify(stats, (_this, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
      dayjs.duration(1, 'hour').asMilliseconds(),
    );
  }

  async getActiveCampaignsStats(
    chainId: number,
  ): Promise<ActiveCampaignsStats | null> {
    const cacheKey = CacheManager.makeCacheKey([
      chainId,
      StatisticsDataKey.ACTIVE_CAMPAIGNS,
    ]);

    const stats = await this.cacheManager.get<string>(cacheKey);

    if (!stats) {
      return null;
    }

    return JSON.parse(stats) as ActiveCampaignsStats;
  }

  async setActiveCampaignsStats(
    chainId: number,
    stats: ActiveCampaignsStats,
  ): Promise<void> {
    const cacheKey = CacheManager.makeCacheKey([
      chainId,
      StatisticsDataKey.ACTIVE_CAMPAIGNS,
    ]);

    await this.cacheManager.set(
      cacheKey,
      JSON.stringify(stats),
      dayjs.duration(30, 'seconds').asMilliseconds(),
    );
  }
}
