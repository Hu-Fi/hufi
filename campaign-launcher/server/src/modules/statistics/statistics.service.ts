import { Injectable, OnModuleInit } from '@nestjs/common';
import { Interval as ScheduleInterval } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { ethers } from 'ethers';

import { ChainId } from '@/common/constants';
import logger from '@/logger';
import { CampaignsService, CampaignStatus } from '@/modules/campaigns';
import { Web3Service } from '@/modules/web3';

@Injectable()
export class StatisticsService implements OnModuleInit {
  private readonly logger = logger.child({
    context: StatisticsService.name,
  });

  /**
   * Atm we don't have many campaigns and its fine to
   * keep these stats in memory and refresh on startup.
   *
   * We will move it to Redis later when will be adding it.
   */
  private readonly completedCampaignsStats: Record<
    number,
    {
      nCompleted: number;
      paidRewardsUsd: number;
      lastCheckedCampaignCreatedAt: number;
    }
  > = {};

  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly web3Service: Web3Service,
  ) {
    for (const chainId of this.web3Service.supportedChainIds) {
      this.completedCampaignsStats[chainId] = {
        nCompleted: 0,
        paidRewardsUsd: 0,
        lastCheckedCampaignCreatedAt: 0,
      };
    }
  }

  async onModuleInit() {
    await this.refreshCompletedCampaignsStats();
  }

  async getCampaignsStats(chainId: ChainId): Promise<{
    nActive: number;
    rewardsPoolUsd: number;
    nCompleted: number;
    paidRewardsUsd: number;
  }> {
    const [{ nActive, rewardsPoolUsd }, { nCompleted, paidRewardsUsd }] =
      await Promise.all([
        this.getActiveCampaignsStats(chainId),
        this.completedCampaignsStats[chainId],
      ]);

    return {
      nActive,
      rewardsPoolUsd,
      nCompleted,
      paidRewardsUsd,
    };
  }

  async getActiveCampaignsStats(chainId: ChainId): Promise<{
    nActive: number;
    rewardsPoolUsd: number;
  }> {
    let nActive = 0;
    let rewardsPoolUsd = 0;

    do {
      const campaigns = await this.campaignsService.getCampaigns(
        chainId,
        {
          statuses: [CampaignStatus.ACTIVE],
        },
        {
          skip: nActive,
        },
      );

      if (campaigns.length === 0) {
        break;
      }

      nActive += campaigns.length;

      for (const campaign of campaigns) {
        try {
          const fundTokenPriceUsd = await this.web3Service.getTokenPriceUsd(
            campaign.fundTokenSymbol,
          );
          if (!fundTokenPriceUsd) {
            continue;
          }

          const balance = Number(
            ethers.formatUnits(campaign.fundAmount, campaign.fundTokenDecimals),
          );
          rewardsPoolUsd += balance * fundTokenPriceUsd;
        } catch {
          // noop
        }
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);

    return {
      nActive,
      rewardsPoolUsd,
    };
  }

  @ScheduleInterval(
    'refreshCompletedCampaignsStats',
    dayjs.duration(4, 'minutes').asMilliseconds(),
  )
  async refreshCompletedCampaignsStats(): Promise<void> {
    for (const chainId of this.web3Service.supportedChainIds) {
      try {
        await this.refreshCompletedCampaignsStatsForChain(chainId);
      } catch (error) {
        this.logger.error('Failed to refresh completed campaigns stats', {
          chainId,
          error,
        });
      }
    }
  }

  async refreshCompletedCampaignsStatsForChain(
    chainId: ChainId,
  ): Promise<void> {
    this.logger.debug('Refreshing completed campaigns stats', { chainId });

    let nCompleted = 0;
    let paidRewardsUsd = 0;
    let lastCheckedCampaignCreatedAt = Date.now();

    let nChecked = 0;
    do {
      const campaigns = await this.campaignsService.getCampaigns(
        chainId,
        {
          statuses: [CampaignStatus.COMPLETED, CampaignStatus.CANCELLED],
          since: new Date(
            this.completedCampaignsStats[chainId].lastCheckedCampaignCreatedAt,
          ),
        },
        {
          skip: nChecked,
        },
      );

      if (campaigns.length === 0) {
        break;
      }

      nChecked += campaigns.length;

      for (const campaign of campaigns) {
        if (
          campaign.status === CampaignStatus.CANCELLED &&
          Number(campaign.amountPaid) === 0
        ) {
          continue;
        }

        const fundTokenPriceUsd = await this.web3Service.getTokenPriceUsd(
          campaign.fundTokenSymbol,
        );
        if (!fundTokenPriceUsd) {
          continue;
        }

        const amountPaid = Number(
          ethers.formatUnits(campaign.fundAmount, campaign.fundTokenDecimals),
        );
        paidRewardsUsd += amountPaid * fundTokenPriceUsd;
        nCompleted += 1;
        lastCheckedCampaignCreatedAt = campaign.createdAt;
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);

    this.logger.debug('Completed campaigns stats refreshed', {
      nCompleted,
      paidRewardsUsd,
      lastCheckedCampaignCreatedAt,
    });

    this.completedCampaignsStats[chainId].nCompleted += nCompleted;
    this.completedCampaignsStats[chainId].paidRewardsUsd += paidRewardsUsd;
    this.completedCampaignsStats[chainId].lastCheckedCampaignCreatedAt =
      lastCheckedCampaignCreatedAt;
  }
}
