import crypto from 'crypto';
import fs from 'fs/promises';

import {
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  TransactionUtils,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ethers } from 'ethers';

import type { ChainId } from '@/common/constants';
import { ContentType } from '@/common/enums';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { WalletWithProvider, Web3Service } from '@/modules/web3';

import * as payoutsUtils from './payouts.utils';
import {
  CalculatedRewardsBatch,
  CampaignWithResults,
  FinalResultsMeta,
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

      let hasPendingResults = true;
      let finalResultsMeta: FinalResultsMeta;
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

        let bulkPayoutsCount = await this.getBulkPayoutsCount(
          signer,
          campaign.address,
          campaign.chainId,
        );

        const rewardsBatchesToPay: CalculatedRewardsBatch[] = [];
        let totalReservedFunds = new Decimal(0);
        for (const intermediateResult of intermediateResultsData.results) {
          totalReservedFunds = totalReservedFunds.plus(
            intermediateResult.reserved_funds,
          );

          const rewardsBatches = this.calculateRewardsForIntermediateResult(
            intermediateResult,
            campaign.fundTokenDecimals,
          );

          logger.debug('Rewards calculated for intermediate result', {
            periodFrom: intermediateResult.from,
            periodTo: intermediateResult.to,
          });

          for (const rewardsBatch of rewardsBatches) {
            /**
             * All participants in batch got zero reward -> nothing to pay
             */
            if (rewardsBatch.rewards.length === 0) {
              logger.debug('Skipped zero rewards batch', {
                batchId: rewardsBatch.id,
              });
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
              let batchTotalReward = new Decimal(0);
              for (const reward of rewardsBatch.rewards) {
                batchTotalReward = batchTotalReward.plus(reward.amount);
              }

              totalReservedFunds = totalReservedFunds.minus(batchTotalReward);

              logger.debug('Skipped rewards batch as per bulkPayoutsCount', {
                batchId: rewardsBatch.id,
                batchTotalReward: batchTotalReward.toString(),
              });
              continue;
            }

            const rewardsFileName =
              await this.writeRewardsBatchToFile(rewardsBatch);
            logger.info('Got new rewards batch to pay', {
              batchId: rewardsBatch.id,
              rewardsFileName,
              githubRunId: process.env.GITHUB_RUN_ID,
              githubRunAttempt: process.env.GITHUB_RUN_ATTEMPT,
            });

            rewardsBatchesToPay.push(rewardsBatch);
          }
        }

        if (rewardsBatchesToPay.length === 0) {
          logger.info('No new payouts for campaign');
          /**
           * No need to early return here: event if no rewards to pay
           * there still might be pending "competion" step. Have this log
           * just for better observability.
           */
        }

        const rawEscrowBalance = await escrowClient.getBalance(
          campaign.address,
        );
        const escrowBalance = new Decimal(
          ethers.formatUnits(rawEscrowBalance, campaign.fundTokenDecimals),
        );
        if (totalReservedFunds.greaterThan(escrowBalance)) {
          throw new Error('Expected payouts amount higher than reserved funds');
        }

        finalResultsMeta = await this.uploadFinalResults(
          campaign,
          intermediateResultsData,
        );

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
            /**
             * TODO: replace it with batch id when SDK is updated
             */
            1,
            false,
            {
              gasPrice,
            },
          );

          logger.info('Rewards batch successfully paid', {
            batchId: rewardsBatchToPay.id,
          });
        }

        const lastResultsAt = intermediateResultsData.results
          .at(-1)
          ?.to.toISOString();

        if (lastResultsAt === manifest.end_date) {
          hasPendingResults = false;
        }

        logger.info('Finished payouts for campaign');
      } catch (error) {
        logger.error('Payouts failed for campaign', error);
        return;
      }

      if (hasPendingResults) {
        logger.info('Campaign not finished yet, skip completion');
        return;
      }

      const escrowStatus = await escrowClient.getStatus(campaign.address);
      if (escrowStatus === EscrowStatus.Complete) {
        logger.info('Campaign auto-completed during payouts');
      } else if (
        [EscrowStatus.Partial, EscrowStatus.Paid].includes(escrowStatus)
      ) {
        // no auto-complete during payouts
        logger.info('Campaign is fully paid, completing it');
        const gasPrice = await this.web3Service.calculateGasPrice(
          campaign.chainId,
        );
        await escrowClient.complete(campaign.address, { gasPrice });
      } else if (escrowStatus === EscrowStatus.Pending) {
        logger.info('Campaign ended with empty results, completing it');

        const escrowBalance = await escrowClient.getBalance(campaign.address);
        const gasPrice = await this.web3Service.calculateGasPrice(
          campaign.chainId,
        );
        await escrowClient.bulkPayOut(
          campaign.address,
          [campaign.launcher],
          [escrowBalance],
          finalResultsMeta.url,
          finalResultsMeta.hash,
          /**
           * TODO: replace it with some meaningful id
           * when sdk is updated
           */
          1,
          true,
          {
            gasPrice,
          },
        );
      } else {
        logger.warn('Unexpected campaign escrow status', {
          escrowStatus,
        });
      }
    } catch (error) {
      logger.error('Error while running payouts cycle for campaign', error);
    } finally {
      logger.info('Finished payouts cycle for campaign');
    }
  }

  private calculateRewardsForIntermediateResult(
    intermediateResult: IntermediateResult,
    tokenDecimals: number,
  ): CalculatedRewardsBatch[] {
    const rewardPool = intermediateResult.reserved_funds;

    let totalScore = new Decimal(0);
    for (const outcomesBatch of intermediateResult.participants_outcomes_batches) {
      for (const outcome of outcomesBatch.results) {
        totalScore = totalScore.plus(outcome.score);
      }
    }

    const rewardsBatches: CalculatedRewardsBatch[] = [];
    for (const outcomesBatch of intermediateResult.participants_outcomes_batches) {
      const rewardsBatch: CalculatedRewardsBatch = {
        id: outcomesBatch.id,
        rewards: [],
      };

      for (const outcome of outcomesBatch.results) {
        let rewardAmount = new Decimal(0);

        if (outcome.score > 0) {
          const participantShare = Decimal.div(outcome.score, totalScore);

          rewardAmount = Decimal.mul(rewardPool, participantShare);
        }

        /**
         * Escrow contract doesn't allow payout of 0 amount.
         * In case if the participant's share is so small
         * that it's lower than minimum payable amount - omit it.
         */
        const truncatedRewardAmount = Number(
          rewardAmount.toFixed(tokenDecimals, Decimal.ROUND_DOWN),
        );
        if (truncatedRewardAmount > 0) {
          rewardsBatch.rewards.push({
            address: outcome.address,
            amount: truncatedRewardAmount,
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
  ): Promise<FinalResultsMeta> {
    const stringifiedResults = JSON.stringify(finalResults);
    const resultsHash = crypto
      .createHash('sha256')
      .update(stringifiedResults)
      .digest('hex');

    const fileName = `${campaign.address}/${resultsHash}.json`;

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
      /**
       * We do not expect more than this active campaigns atm
       */
      first: 100,
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
        launcher: escrow.launcher,
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

  private async writeRewardsBatchToFile(
    rewardsBatch: CalculatedRewardsBatch,
  ): Promise<string> {
    const fileName = `rewards_batch_${rewardsBatch.id}.json`;

    await fs.writeFile(fileName, JSON.stringify(rewardsBatch.rewards, null, 2));

    return fileName;
  }
}
