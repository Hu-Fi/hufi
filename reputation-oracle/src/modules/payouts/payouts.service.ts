import crypto from 'crypto';
import fs from 'fs/promises';

import EscrowABI from '@human-protocol/core/abis/Escrow.json';
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
import * as escrowUtils from '@/common/utils/escrow';
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

      let escrowStatus = await escrowClient.getStatus(campaign.address);
      let escrowStatusString = EscrowStatus[escrowStatus];
      if (campaign.status !== escrowStatusString) {
        logger.warn('Campaign status mismatch, avoiding payouts', {
          campaignStatus: campaign.status,
          escrowStatus,
          escrowStatusString,
        });
        return;
      }

      const manifest = await payoutsUtils.retrieveCampaignManifest(
        campaign.manifest,
        campaign.manifestHash,
      );

      if (escrowStatus === EscrowStatus.ToCancel) {
        const campaignStartDate = new Date(manifest.start_date);
        if (campaignStartDate.valueOf() > Date.now()) {
          logger.info(
            'Campaign cancellation requested before campaign started, cancelling',
          );
          await escrowClient.cancel(campaign.address);
          return;
        }

        if (!campaign.intermediateResultsUrl) {
          logger.info(
            'Results not yet recorded for ToCancel campaign, skip it',
          );
          return;
        }
      }

      const intermediateResultsData =
        await payoutsUtils.downloadIntermediateResults(
          campaign.intermediateResultsUrl as string,
          campaign.intermediateResultsHash as string,
        );

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

      const rawEscrowReservedFunds = await escrowClient.getReservedFunds(
        campaign.address,
      );
      const escrowReservedFunds = new Decimal(
        ethers.formatUnits(rawEscrowReservedFunds, campaign.fundTokenDecimals),
      );
      if (totalReservedFunds.greaterThan(escrowReservedFunds)) {
        throw new Error('Expected payouts amount higher than reserved funds');
      }

      const finalResultsMeta = await this.uploadFinalResults(
        campaign,
        intermediateResultsData,
      );

      for (const rewardsBatchToPay of rewardsBatchesToPay) {
        const recipientToAmountMap = new Map<string, bigint>();
        for (const { address, amount } of rewardsBatchToPay.rewards) {
          recipientToAmountMap.set(
            address,
            ethers.parseUnits(amount, campaign.fundTokenDecimals),
          );
        }

        const gasPrice = await this.web3Service.calculateGasPrice(
          campaign.chainId,
        );
        const latestNonce = await signer.getNonce('latest');

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
            nonce: latestNonce,
          },
        );

        logger.info('Rewards batch successfully paid', {
          batchId: rewardsBatchToPay.id,
        });
      }

      logger.info('Finished payouts for campaign');

      // =================== finalization steps below ===================

      escrowStatus = await escrowClient.getStatus(campaign.address);
      escrowStatusString = EscrowStatus[escrowStatus];
      if (
        [EscrowStatus.Complete, EscrowStatus.Cancelled].includes(escrowStatus)
      ) {
        logger.info('Campaign auto-finalized during payouts', {
          escrowStatus,
          escrowStatusString,
        });
        return;
      }

      let expectedFinalLastResultsAt: string;
      if (escrowStatus === EscrowStatus.ToCancel) {
        const cancellationRequestedAt =
          await escrowUtils.getCancellationRequestDate(
            campaign.chainId,
            campaign.address,
          );
        expectedFinalLastResultsAt = cancellationRequestedAt.toISOString();
      } else {
        expectedFinalLastResultsAt = manifest.end_date;
      }

      const lastResultsAt = intermediateResultsData.results
        .at(-1)!
        .to.toISOString();
      if (lastResultsAt !== expectedFinalLastResultsAt) {
        logger.info('Campaign not finished yet, skip completion', {
          lastResultsAt,
          expectedFinalLastResultsAt,
        });
        return;
      } else {
        logger.info('Campaign finished, going to finalize', {
          lastResultsAt,
          expectedFinalLastResultsAt,
        });
      }

      if (escrowStatus === EscrowStatus.ToCancel) {
        logger.info('Campaign ended with cancellation request, cancelling it');
        const gasPrice = await this.web3Service.calculateGasPrice(
          campaign.chainId,
        );
        await escrowClient.cancel(campaign.address, { gasPrice });
      } else if (
        [
          // pending expected when no payouts needed (aka results w/ 0)
          EscrowStatus.Pending,
          // partial expected when all payouts made
          EscrowStatus.Partial,
          // paid is not expected/used, just for potential changes
          EscrowStatus.Paid,
        ].includes(escrowStatus)
      ) {
        // no auto-finalize during payouts
        logger.info('No more payouts expected for campaign, completing it', {
          escrowStatus,
          escrowStatusString,
        });

        const gasPrice = await this.web3Service.calculateGasPrice(
          campaign.chainId,
        );
        await escrowClient.complete(campaign.address, { gasPrice });
      } else {
        logger.warn('Unexpected campaign escrow status', {
          escrowStatus,
          escrowStatusString,
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
    const rewardPool = new Decimal(intermediateResult.reserved_funds);

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
        const truncatedRewardAmount = rewardAmount.toDecimalPlaces(
          tokenDecimals,
          Decimal.ROUND_DOWN,
        );
        if (truncatedRewardAmount.greaterThan(0)) {
          rewardsBatch.rewards.push({
            address: outcome.address,
            amount: truncatedRewardAmount.toString(),
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
    try {
      const escrows = await EscrowUtils.getEscrows({
        chainId: chainId as number,
        reputationOracle: this.web3ConfigService.operatorAddress,
        status: [
          EscrowStatus.Pending,
          EscrowStatus.Partial,
          EscrowStatus.ToCancel,
        ],
        /**
         * We do not expect more than this active campaigns atm
         */
        first: 100,
      });

      const campaignsWithResults: CampaignWithResults[] = [];
      for (const escrow of escrows) {
        if (escrow.status !== EscrowStatus[EscrowStatus.ToCancel]) {
          const hasIntermediateResults =
            escrow.intermediateResultsUrl && escrow.intermediateResultsHash;
          if (!hasIntermediateResults) {
            continue;
          }
        }
        const fundTokenDecimals = await this.web3Service.getTokenDecimals(
          escrow.chainId,
          escrow.token,
        );

        campaignsWithResults.push({
          chainId: escrow.chainId,
          address: escrow.address,
          launcher: escrow.launcher,
          status: escrow.status,
          /**
           * It's expected that escrow can be in "ToCancel" status
           * only if it properly set up, so it should always have
           * manifest and its hash
           */
          manifest: escrow.manifest as string,
          manifestHash: escrow.manifestHash as string,
          intermediateResultsUrl: escrow.intermediateResultsUrl,
          intermediateResultsHash: escrow.intermediateResultsHash,
          fundTokenAddress: escrow.token,
          fundTokenDecimals,
          fundAmount: Number(
            ethers.formatUnits(escrow.totalFundedAmount, fundTokenDecimals),
          ),
        });
      }

      return campaignsWithResults;
    } catch (error) {
      const message = 'Failed to get campaigns for payouts';
      this.logger.error(message, { chainId, error });
      throw new Error(message);
    }
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
        method: 'createEscrow',
      })
    )[0];

    const bulkInterfaceV3 = new ethers.Interface(EscrowABI);
    const topicV3 = bulkInterfaceV3.getEvent('BulkTransferV3')!.topicHash;

    const logs = await signer.provider.getLogs({
      address: escrowAddress,
      topics: [topicV3],
      fromBlock: block,
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
