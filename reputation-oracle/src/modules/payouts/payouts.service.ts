import crypto from 'crypto';

import {
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  IEscrowsFilter,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

import type { ChainId } from '@/common/constants';
import { ContentType } from '@/common/enums';
import * as decimalUtils from '@/common/utils/decimal';
import * as web3Utils from '@/common/utils/web3';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { Web3Service } from '@/modules/web3';

import * as campaignUtils from './campaign.utils';
import {
  CalculatedRewardsBatch,
  CampaignWithResults,
  IntermediateResult,
  IntermediateResultsData,
} from './types';
import { StorageService } from '../storage';

@Injectable()
export class PayoutsService {
  private readonly logger = logger.child({
    context: PayoutsService.name,
  });

  constructor(
    private readonly storageService: StorageService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly web3Service: Web3Service,
  ) {}

  async runPayoutsCycle(): Promise<void> {
    this.logger.info('Going to run payouts cycle', {
      supportedChainIds: this.web3Service.supportedChainIds,
    });

    for (const chainId of this.web3Service.supportedChainIds) {
      const campaigns = await this.getCampaignsForPayouts(chainId);

      logger.info('Found campaigns waiting for payouts', {
        chainId,
        campaigns: campaigns.map((c) => c.address),
      });

      for (const campaign of campaigns) {
        await this.runPayoutsCycleForCampaign(campaign);
      }
    }

    this.logger.info('Payouts cycle finished');
  }

  async runPayoutsCycleForCampaign(
    campaign: CampaignWithResults,
  ): Promise<void> {
    const logger = this.logger.child({
      chainId: campaign.chainId,
      campaign: campaign.address,
    });

    logger.info('Run payouts cycle for campaign');

    try {
      const signer = this.web3Service.getSigner(campaign.chainId);
      const escrowClient = await EscrowClient.build(signer);

      let allResultsPaid = false;
      try {
        const [manifest, intermediateResultsData] = await Promise.all([
          campaignUtils.downloadCampaignManifest(
            campaign.manifestUrl,
            campaign.manifestHash,
          ),
          campaignUtils.downloadIntermediateResults(
            campaign.intermediateResultsUrl,
          ),
        ]);

        if (intermediateResultsData.results.length === 0) {
          throw new Error('Intermediate results are not recorded');
        }

        const dailyReward = campaignUtils.calculateDailyReward(
          campaign,
          manifest,
        );
        logger.info('Calculated daily reward for campaign', {
          startDate: manifest.start_date,
          endDate: manifest.end_date,
          fundAmount: campaign.fundAmount,
          fundTokenAddress: campaign.fundTokenAddress,
          dailyReward,
        });

        const finalResultsMeta = await this.uploadFinalResults(
          campaign,
          intermediateResultsData,
        );

        for (const intermediateResult of intermediateResultsData.results) {
          /**
           * TODO: somehow check if this result was already paid before
           */
          if (intermediateResult.total_volume === 0) {
            continue;
          }

          const rewardsBatches = this.calculateRewardsForDailyResult(
            intermediateResult,
            dailyReward,
            manifest.daily_volume_target,
          );

          logger.info('Rewards calculated', {
            rewardsBatches,
          });

          for (const rewardsBatch of rewardsBatches) {
            /**
             * TODO: somehow check if this rewards batch was already paid before
             */

            const recipientToAmountMap = new Map<string, bigint>();
            for (const { address, amount } of rewardsBatch.rewards) {
              recipientToAmountMap.set(
                address,
                ethers.parseUnits(
                  amount.toString(),
                  campaign.fundTokenDecimals,
                ),
              );
            }

            const gasPrice = await this.web3Service.calculateGasPrice(
              campaign.chainId,
            );

            await escrowClient.bulkPayOut(
              campaign.address,
              Array.from(recipientToAmountMap.keys()),
              Array.from(recipientToAmountMap.values()),
              finalResultsMeta.url,
              finalResultsMeta.hash,
              /**
               * TODO: replace it with batch id when SDK is updated
               */
              1,
              false,
              {
                gasPrice,
              },
            );
          }
        }

        const lastResultsAt = intermediateResultsData.results
          .at(-1)
          ?.to.toISOString();

        if (lastResultsAt === manifest.end_date) {
          allResultsPaid = true;
        }

        logger.info('Finished payouts for campaign');
      } catch (error) {
        logger.error('Payouts failed for campaign', error);
      }

      if (allResultsPaid) {
        try {
          await escrowClient.complete(campaign.address);
        } catch (error) {
          logger.error('Failed to complete campaign', error);
        }
      } else {
        logger.info('Campaign not finished yet, skip completion');
      }

      logger.info('Finished payouts cycle for campaign');
    } catch (error) {
      logger.error('Error while running payouts cycle for campaign', error);
    }
  }

  private calculateRewardsForDailyResult(
    intermediateResult: IntermediateResult,
    dailyReward: number,
    dailyVolumeTarget: number,
  ): CalculatedRewardsBatch[] {
    const rewardRatio = Math.min(
      intermediateResult.total_volume / dailyVolumeTarget,
      1,
    );

    const totalSharedReward = rewardRatio * dailyReward;

    let totalScore = 0;
    for (const outcomesBatch of intermediateResult.participants_outcomes_batches) {
      for (const outcome of outcomesBatch.results) {
        totalScore += outcome.score;
      }
    }

    const rewardsBatches: CalculatedRewardsBatch[] = [];
    for (const outcomesBatch of intermediateResult.participants_outcomes_batches) {
      const rewardsBatch: CalculatedRewardsBatch = {
        id: outcomesBatch.id,
        rewards: [],
      };

      for (const outcome of outcomesBatch.results) {
        const participantShare = decimalUtils.div(totalScore, outcome.score);
        const rewardAmount = decimalUtils.div(
          totalSharedReward,
          participantShare,
        );

        rewardsBatch.rewards.push({
          address: outcome.address,
          amount: rewardAmount,
        });
      }

      rewardsBatches.push(rewardsBatch);
    }

    return rewardsBatches;
  }

  private async uploadFinalResults(
    campaign: CampaignWithResults,
    finalResults: IntermediateResultsData,
  ): Promise<{
    url: string;
    hash: string;
  }> {
    const stringifiedResults = JSON.stringify(finalResults);
    const resultsHash = crypto
      .createHash('sha256')
      .update(stringifiedResults)
      .digest('hex');

    const fileName = `${campaign.address}.json`;

    const resultsUrl = await this.storageService.uploadData(
      stringifiedResults,
      fileName,
      ContentType.JSON,
    );

    return {
      url: resultsUrl,
      hash: resultsHash,
    };
  }

  private async getCampaignsForPayouts(
    chainId: ChainId,
  ): Promise<CampaignWithResults[]> {
    const baseFilter: IEscrowsFilter = {
      chainId: chainId as number,
      reputationOracle: this.web3ConfigService.operatorAddress,
    };

    /**
     * TODO: add "toCancelEscrows" when escrow cancelletion is done
     */
    const [pendingEscrows, partialEscrows] = await Promise.all([
      EscrowUtils.getEscrows({
        ...baseFilter,
        status: EscrowStatus.Pending,
      }),
      EscrowUtils.getEscrows({
        ...baseFilter,
        status: EscrowStatus.Partial,
      }),
    ]);

    const campaignsWithResults: CampaignWithResults[] = [];
    for (const escrow of [...pendingEscrows, ...partialEscrows]) {
      if (!escrow.intermediateResultsUrl) {
        continue;
      }

      const fundTokenDecimals = web3Utils.getTokenDecimals(
        escrow.chainId,
        escrow.token,
      );

      campaignsWithResults.push({
        chainId: escrow.chainId,
        address: escrow.address,
        manifestUrl: escrow.manifestUrl as string,
        manifestHash: escrow.manifestHash as string,
        intermediateResultsUrl: escrow.intermediateResultsUrl as string,
        fundTokenAddress: escrow.token,
        fundTokenDecimals,
        fundAmount: Number(
          ethers.formatUnits(escrow.totalFundedAmount, fundTokenDecimals),
        ),
      });
    }

    return campaignsWithResults;
  }
}
