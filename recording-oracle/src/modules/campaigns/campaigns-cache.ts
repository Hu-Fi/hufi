import { Injectable } from '@nestjs/common';

import { CacheManager } from '@/infrastructure/cache';

import { CampaignProgressMeta } from './progress-checking';
import { CampaignProgress } from './types';

enum CampaignsDataKey {
  INTERIM_PROGRESS = 'interim_progress',
  DISCOVERY_ANCHOR = 'discovered_at',
}

@Injectable()
export class CampaignsCache {
  constructor(private readonly cacheManager: CacheManager) {}

  async getInterimProgress<T extends CampaignProgressMeta>(
    campaignId: string,
  ): Promise<CampaignProgress<T> | null> {
    const cacheKey = CacheManager.makeCacheKey([
      campaignId,
      CampaignsDataKey.INTERIM_PROGRESS,
    ]);

    const progress = await this.cacheManager.get<string>(cacheKey);

    if (progress === null) {
      return null;
    }

    return JSON.parse(progress) as CampaignProgress<T>;
  }

  async setInterimProgress(
    campaignId: string,
    progress: CampaignProgress<CampaignProgressMeta>,
    expiresAt: Date,
  ): Promise<void> {
    const cacheKey = CacheManager.makeCacheKey([
      campaignId,
      CampaignsDataKey.INTERIM_PROGRESS,
    ]);

    await this.cacheManager.set(cacheKey, JSON.stringify(progress), expiresAt);
  }

  async getChainDiscoveryAnchor(chainId: number): Promise<Date | null> {
    const cacheKey = CacheManager.makeCacheKey([
      chainId,
      CampaignsDataKey.DISCOVERY_ANCHOR,
    ]);

    const lastDiscoveryAt = await this.cacheManager.get<string>(cacheKey);

    if (lastDiscoveryAt === null) {
      return null;
    }

    return new Date(lastDiscoveryAt);
  }

  async setChainDiscoveryAnchor(
    chainId: number,
    lastDiscoveryAt: Date,
  ): Promise<void> {
    const cacheKey = CacheManager.makeCacheKey([
      chainId,
      CampaignsDataKey.DISCOVERY_ANCHOR,
    ]);

    await this.cacheManager.set(cacheKey, lastDiscoveryAt.toISOString());
  }
}
