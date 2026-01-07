import { Inject } from '@nestjs/common';

import { REDIS_CACHE_CLIENT, type RedisClient } from '@/infrastructure/redis';

enum StatisticsDataKey {
  COMPLETED_CAMPAIGNS = 'completed_campaigns',
  ACTIVE_CAMPAIGNS = 'active_campaigns',
  TOTAL_REWARDS = 'total_rewards',
}

type CompletedCampaignsStats = {
  nCompleted: number;
  lastCheckedAt: string;
};

type TotalRewardsStats<T> = {
  paidRewardsUsd: number;
  lastCheckedBlock: T;
  updatedAt: string;
};

export type ActiveCampaignsStats = {
  nActive: number;
  rewardsPoolUsd: number;
  updatedAt: string;
};

export class StatisticsCache {
  constructor(
    @Inject(REDIS_CACHE_CLIENT) private readonly redisCacheClient: RedisClient,
  ) {}

  private makeCacheKey(chainId: number, dataKey: string): string {
    return `statistics:${chainId}:${dataKey}`;
  }

  async getCompletedCampaignsStats(
    chainId: number,
  ): Promise<CompletedCampaignsStats | null> {
    const cacheKey = this.makeCacheKey(
      chainId,
      StatisticsDataKey.COMPLETED_CAMPAIGNS,
    );

    const stats = await this.redisCacheClient.get(cacheKey);

    if (!stats) {
      return null;
    }

    return JSON.parse(stats) as CompletedCampaignsStats;
  }

  async setCompletedCampaignsStats(
    chainId: number,
    stats: CompletedCampaignsStats,
  ): Promise<void> {
    const cacheKey = this.makeCacheKey(
      chainId,
      StatisticsDataKey.COMPLETED_CAMPAIGNS,
    );

    await this.redisCacheClient.set(cacheKey, JSON.stringify(stats));
  }

  async getTotalRewardsStats(
    chainId: number,
  ): Promise<TotalRewardsStats<bigint> | null> {
    const cacheKey = this.makeCacheKey(
      chainId,
      StatisticsDataKey.TOTAL_REWARDS,
    );

    const stats = await this.redisCacheClient.get(cacheKey);

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
    const cacheKey = this.makeCacheKey(
      chainId,
      StatisticsDataKey.TOTAL_REWARDS,
    );

    await this.redisCacheClient.set(
      cacheKey,
      JSON.stringify(stats, (_this, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
    );
  }

  async getActiveCampaignsStats(
    chainId: number,
  ): Promise<ActiveCampaignsStats | null> {
    const cacheKey = this.makeCacheKey(
      chainId,
      StatisticsDataKey.ACTIVE_CAMPAIGNS,
    );

    const stats = await this.redisCacheClient.get(cacheKey);

    if (!stats) {
      return null;
    }

    return JSON.parse(stats) as ActiveCampaignsStats;
  }

  async setActiveCampaignsStats(
    chainId: number,
    stats: ActiveCampaignsStats,
  ): Promise<void> {
    const cacheKey = this.makeCacheKey(
      chainId,
      StatisticsDataKey.ACTIVE_CAMPAIGNS,
    );

    await this.redisCacheClient.setEx(cacheKey, 30, JSON.stringify(stats));
  }
}
