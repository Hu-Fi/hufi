import crypto from 'crypto';

import {
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  TransactionUtils,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

import type { ChainId } from '@/common/constants';
import { ContentType } from '@/common/enums';
import * as decimalUtils from '@/common/utils/decimal';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { WalletWithProvider, Web3Service } from '@/modules/web3';

import * as payoutsUtils from './payouts.utils';
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
      const chainLogger = this.logger.child({ chainId });

      chainLogger.info('Looking for campaigns to pay out');
      const campaigns = await this.getCampaignsForPayouts(chainId);
      if (campaigns.length > 0) {
        chainLogger.info('Found campaigns waiting for payouts', {
          campaigns: campaigns.map((c) => c.address),
        });
      } else {
        chainLogger.info('No campaigns found for payouts');
      }

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
      campaignAddress: ethers.getAddress(campaign.address),
    });

    logger.info('Run payouts cycle for campaign');

    try {
      const signer = this.web3Service.getSigner(campaign.chainId);
      const escrowClient = await EscrowClient.build(signer);

      let allResultsPaid = false;
      try {
        const [manifest, intermediateResultsData] = await Promise.all([
          payoutsUtils.retrieveCampaignManifest(
            campaign.manifest,
            campaign.manifestHash,
          ),
          payoutsUtils.downloadIntermediateResults(
            campaign.intermediateResultsUrl,
          ),
        ]);

        if (intermediateResultsData.results.length === 0) {
          throw new Error('Intermediate results are not recorded');
        }

        const finalResultsMeta = await this.uploadFinalResults(
          campaign,
          intermediateResultsData,
        );

        let bulkPayoutsCount = await this.getBulkPayoutsCount(
          signer,
          campaign.address,
          campaign.chainId,
        );

        const rewardsBatchesToPay: CalculatedRewardsBatch[] = [];
        let totalReservedFunds = 0;
        for (const intermediateResult of intermediateResultsData.results) {
          totalReservedFunds = decimalUtils.add(
            totalReservedFunds,
            intermediateResult.reserved_funds,
          );
          /**
           * Zero volume -> nothing to pay
           */
          if (intermediateResult.total_volume === 0) {
            continue;
          }

          const rewardsBatches = this.calculateRewardsForIntermediateResult(
            intermediateResult,
            campaign.fundTokenDecimals,
          );
          logger.info('Rewards calculated', {
            periodFrom: intermediateResult.from,
            periodTo: intermediateResult.to,
            rewardsBatches,
          });

          for (const rewardsBatch of rewardsBatches) {
            /**
             * All participants in batch got zero reward -> nothing to pay
             */
            if (rewardsBatch.rewards.length === 0) {
              continue;
            }
            /**
             * Temp hack to avoid double-payouts until payoutId is added to escrow.
             *
             * Rationale: payout batches are run sequentially and in case
             * some payouts batch fails - the next one won't be processed,
             * so as a temp fix we are counting the number of bulkPayout events
             * happened for the escrow and skipping first X items.
             */
            if (bulkPayoutsCount > 0) {
              bulkPayoutsCount -= 1;

              /**
               * Also subtract amount of this paid batch
               * from total reserved value for check
               */
              let batchTotalReward = 0;
              for (const reward of rewardsBatch.rewards) {
                batchTotalReward = decimalUtils.add(
                  batchTotalReward,
                  reward.amount,
                );
              }

              totalReservedFunds = decimalUtils.sub(
                totalReservedFunds,
                batchTotalReward,
              );
              continue;
            }

            rewardsBatchesToPay.push(rewardsBatch);
          }
        }

        const fundsReservedOnEscrow = await escrowClient.getReservedFunds(
          campaign.address,
        );
        if (totalReservedFunds > fundsReservedOnEscrow) {
          throw new Error('Expected payouts amount higher than reserved funds');
        }

        for (const rewardsBatchToPay of rewardsBatchesToPay) {
          const recipientToAmountMap = new Map<string, bigint>();
          for (const { address, amount } of rewardsBatchToPay.rewards) {
            recipientToAmountMap.set(
              address,
              ethers.parseUnits(amount.toString(), campaign.fundTokenDecimals),
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
            rewardsBatchToPay.id,
            false,
            {
              gasPrice,
            },
          );
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
        logger.info('Campaign is fully paid, completing it');
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

  private calculateRewardsForIntermediateResult(
    intermediateResult: IntermediateResult,
    tokenDecimals: number,
  ): CalculatedRewardsBatch[] {
    const rewardPool = intermediateResult.reserved_funds;

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
        let rewardAmount = 0;

        if (outcome.score > 0) {
          const participantShare = decimalUtils.div(totalScore, outcome.score);

          rewardAmount = decimalUtils.div(rewardPool, participantShare);
        }

        /**
         * Escrow contract doesn't allow payout of 0 amount.
         * In case if the participant's share is so small
         * that it's lower than minumum payable amount - omit it.
         */
        const truncatedRewardAmount = decimalUtils.truncate(
          rewardAmount,
          tokenDecimals,
        );
        if (truncatedRewardAmount > 0) {
          rewardsBatch.rewards.push({
            address: outcome.address,
            amount: rewardAmount,
          });
        }
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
    const escrows = await EscrowUtils.getEscrows({
      chainId: chainId as number,
      reputationOracle: this.web3ConfigService.operatorAddress,
      /**
       * TODO: add "toCancelEscrows" when escrow cancelletion is done
       */
      status: [EscrowStatus.Pending, EscrowStatus.Partial],
    });

    const campaignsWithResults: CampaignWithResults[] = [];
    for (const escrow of escrows) {
      if (!escrow.intermediateResultsUrl) {
        continue;
      }

      const fundTokenDecimals = await this.web3Service.getTokenDecimals(
        escrow.chainId,
        escrow.token,
      );

      campaignsWithResults.push({
        chainId: escrow.chainId,
        address: escrow.address,
        manifest: escrow.manifest as string,
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

  private async getBulkPayoutsCount(
    signer: WalletWithProvider,
    escrowAddress: string,
    chainId: ChainId,
  ) {
    const { block } = (
      await TransactionUtils.getTransactions({
        chainId: chainId as number,
        escrow: escrowAddress,
        method: 'setup',
      })
    )[0];

    const bulkInterface = new ethers.Interface([
      'event BulkTransferV2(uint256 indexed _txId, address[] _recipients, uint256[] _amounts, bool _isPartial, string finalResultsUrl)',
    ]);

    const topic = bulkInterface.getEvent('BulkTransferV2')!.topicHash;

    const logs = await signer.provider.getLogs({
      address: escrowAddress,
      topics: [topic],
      fromBlock: Number(block),
      toBlock: 'latest',
    });

    return logs.length;
  }
}
