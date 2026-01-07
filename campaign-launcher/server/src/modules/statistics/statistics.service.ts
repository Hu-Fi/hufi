import { OrderDirection, TransactionUtils } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { Interval as ScheduleInterval } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { ethers } from 'ethers';

import { ChainId } from '@/common/constants';
import { PreventCallOverlap } from '@/common/decorators';
import Environment from '@/common/utils/environment';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { CampaignsService, CampaignStatus } from '@/modules/campaigns';
import { Web3Service } from '@/modules/web3';

import { type ActiveCampaignsStats, StatisticsCache } from './statistics-cache';

@Injectable()
export class StatisticsService {
  private readonly logger = logger.child({
    context: StatisticsService.name,
  });

  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly statisticsCache: StatisticsCache,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly web3Service: Web3Service,
  ) {}

  async getCampaignsStats(chainId: ChainId): Promise<{
    nActive: number;
    rewardsPoolUsd: number;
    nCompleted: number | null;
    paidRewardsUsd: number | null;
  }> {
    const [
      { nActive, rewardsPoolUsd },
      completedCampaignsStats,
      totalRewardsStats,
    ] = await Promise.all([
      this.getActiveCampaignsStats(chainId),
      this.statisticsCache.getCompletedCampaignsStats(chainId),
      this.statisticsCache.getTotalRewardsStats(chainId),
    ]);

    return {
      nActive,
      rewardsPoolUsd,
      nCompleted: completedCampaignsStats?.nCompleted ?? null,
      paidRewardsUsd: totalRewardsStats?.paidRewardsUsd ?? null,
    };
  }

  private async getActiveCampaignsStats(
    chainId: ChainId,
  ): Promise<ActiveCampaignsStats> {
    try {
      let activeCampaignsStats =
        await this.statisticsCache.getActiveCampaignsStats(chainId);

      if (!activeCampaignsStats) {
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
                ethers.formatUnits(
                  campaign.fundAmount,
                  campaign.fundTokenDecimals,
                ),
              );
              rewardsPoolUsd += balance * fundTokenPriceUsd;
            } catch {
              // noop
            }
          }
          // eslint-disable-next-line no-constant-condition
        } while (true);

        activeCampaignsStats = {
          nActive,
          rewardsPoolUsd,
          updatedAt: new Date().toISOString(),
        };

        await this.statisticsCache.setActiveCampaignsStats(
          chainId,
          activeCampaignsStats,
        );
      }

      return activeCampaignsStats;
    } catch (error) {
      const errorMessage = 'Failed to get active campaigns stats';
      this.logger.error(errorMessage, {
        chainId,
        error,
      });

      throw new Error(errorMessage);
    }
  }

  @ScheduleInterval(dayjs.duration(4, 'minutes').asMilliseconds())
  @PreventCallOverlap()
  private async refreshCompletedCampaignsStats(): Promise<void> {
    for (const chainId of this.web3Service.supportedChainIds) {
      await this.refreshCompletedCampaignsStatsForChain(chainId);
    }
  }

  /**
   * Refreshes in-memory stats on number of completed campaigns for chain.
   *
   * Takes into account both "completed" and "cancelled" because
   * cancellation might have been requested in mid-campaign
   * and technically our platform successfully operated on them.
   */
  private async refreshCompletedCampaignsStatsForChain(
    chainId: ChainId,
  ): Promise<void> {
    try {
      this.logger.debug('Refreshing completed campaigns stats', {
        chainId,
      });

      /**
       * Currently SDK doesn't allow necessary stats queries,
       * so we have to recalculate N of completed campaigns on every run.
       *
       * It's necessary for correct stat calculation, because there might be next case:
       * - campaign C1 createdAt C1_T1, completed at C1_T2
       * - campaign C2 createdAt C2_T1, completed at C2_T2
       * - C2_T1 > C1_T1, C2_T2 < C1_T2
       * so C2 completes earlier than C1, we remember its createdAt (because it's default
       * orderBy prop that can't be changed) and never count C1 when it completes.
       */
      let nCompleted = 0;
      do {
        const campaigns = await this.campaignsService.getCampaigns(
          chainId,
          {
            statuses: [CampaignStatus.COMPLETED, CampaignStatus.CANCELLED],
          },
          {
            limit: 100,
            skip: nCompleted,
          },
        );

        if (campaigns.length === 0) {
          break;
        }

        nCompleted += campaigns.length;
        // eslint-disable-next-line no-constant-condition
      } while (true);

      /**
       * Update cached values only if the whole run succeeded
       * in order to avoid double-counting
       */
      await this.statisticsCache.setCompletedCampaignsStats(chainId, {
        nCompleted,
        lastCheckedAt: new Date().toISOString(),
      });

      this.logger.debug('Completed campaigns stats refreshed', {
        nCompleted,
      });
    } catch (error) {
      this.logger.error('Failed to refresh completed campaigns stats', {
        chainId,
        error,
      });
    }
  }

  @ScheduleInterval(dayjs.duration(4, 'minutes').asMilliseconds())
  @PreventCallOverlap()
  private async refreshTotalRewardsStats(): Promise<void> {
    for (const chainId of this.web3Service.supportedChainIds) {
      await this.refreshTotalRewardsStatsForChain(chainId);
    }
  }

  /**
   * Refreshes in-memory stats on total amount of distributed rewards.
   *
   * To calculate these we have to find actual payoust made for
   * all campaign statuses.
   */
  private async refreshTotalRewardsStatsForChain(
    chainId: ChainId,
  ): Promise<void> {
    try {
      const totalRewardsStats =
        await this.statisticsCache.getTotalRewardsStats(chainId);

      /**
       * getTransactions query uses "gte" operator for startBlock,
       * so add 1 to avoid double-check of last checked block
       */
      const startBlock = (totalRewardsStats?.lastCheckedBlock || -1n) + 1n;

      this.logger.debug('Refreshing total rewards stats', {
        chainId,
        startBlock,
      });

      let totalPaidAmountUsd = 0;
      let nChecked = 0;
      let lastCheckedBlock: bigint | undefined;
      do {
        const transactions = await TransactionUtils.getTransactions({
          chainId: chainId as number,
          fromAddress: this.web3ConfigService.reputationOracle,
          method: 'bulkTransfer',
          /**
           * TODO: remove type casting when SDK is fixed
           */
          startBlock: Number(startBlock),
          orderDirection: OrderDirection.ASC,
          first: 100,
          skip: nChecked,
        });

        if (transactions.length === 0) {
          break;
        }

        for (const tx of transactions) {
          const tokenAddress = tx.token as string;
          const [txTokenSymbol, txTokenDecimals] = await Promise.all([
            this.web3Service.getTokenSymbol(chainId, tokenAddress),
            this.web3Service.getTokenDecimals(chainId, tokenAddress),
          ]);

          if (
            !['usdt', 'usdt0', 'usdc'].includes(txTokenSymbol.toLowerCase()) &&
            Environment.isProduction()
          ) {
            /**
             * ATM we support only USDT and USDC as fund token,
             * so it's fine to take paid amount as is now for stats.
             *
             * For dev envs allow all tokens to be summarized.
             *
             * In case we add new funding tokens - we might need to revisit this stat.
             */
            continue;
          }

          for (const internalTx of tx.internalTransactions) {
            const amountPaid = Number(
              ethers.formatUnits(internalTx.value, txTokenDecimals),
            );
            totalPaidAmountUsd += amountPaid;
          }
        }

        lastCheckedBlock = transactions.at(-1)!.block;
        nChecked += transactions.length;
        // eslint-disable-next-line no-constant-condition
      } while (true);

      if (lastCheckedBlock) {
        /**
         * Update cached values only if new blocks got scanned
         * in order to avoid double-counting
         */
        const prevPaidRewardsUsd = totalRewardsStats?.paidRewardsUsd || 0;
        await this.statisticsCache.setTotalRewardsStats(chainId, {
          paidRewardsUsd: prevPaidRewardsUsd + totalPaidAmountUsd,
          lastCheckedBlock,
          updatedAt: new Date().toISOString(),
        });
      }

      this.logger.debug('Total rewards stats refreshed', {
        nChecked,
        lastCheckedBlock,
      });
    } catch (error) {
      this.logger.error('Failed to refresh total rewards stats', {
        chainId,
        error,
      });
    }
  }
}
