import fs from 'fs/promises';

import EscrowABI from '@human-protocol/core/abis/Escrow.json';
import { EscrowClient, EscrowStatus, EscrowUtils } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ethers } from 'ethers';
import _ from 'lodash';

import type { ChainId } from '@/common/constants';
import { ContentType } from '@/common/enums';
import * as cryptoUtils from '@/common/utils/crypto';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { StorageService } from '@/modules/storage';
import { WalletWithProvider, Web3Service } from '@/modules/web3';

import * as payoutsUtils from './payouts.utils';
import {
  CalculatedReward,
  CalculatedRewardsBatch,
  CampaignManifest,
  CampaignWithResults,
  CompetitiveCampaignManifest,
  FinalResultsMeta,
  IntermediateResult,
  IntermediateResultsData,
  ParticipantOutcome,
} from './types';

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
    const campaignLogger = this.logger.child({
      chainId: campaign.chainId,
      campaignAddress: ethers.getAddress(campaign.address),
    });

    campaignLogger.info('Run payouts cycle for campaign');

    try {
      const signer = this.web3Service.getSigner(campaign.chainId);
      const escrowClient = await EscrowClient.build(signer);

      let escrowStatus = await escrowClient.getStatus(campaign.address);
      let escrowStatusString = EscrowStatus[escrowStatus];
      if (campaign.status !== escrowStatusString) {
        campaignLogger.warn('Campaign status mismatch, avoiding payouts', {
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
        if (
          campaign.cancellationRequestedAt!.valueOf() <
          campaignStartDate.valueOf()
        ) {
          campaignLogger.info(
            'Campaign cancellation requested before campaign started, cancelling',
          );
          await escrowClient.cancel(campaign.address, {
            timeoutMs: this.web3ConfigService.escrowTxTimeout,
          });
          return;
        }

        if (!campaign.intermediateResultsUrl) {
          campaignLogger.info(
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

      let totalReservedFunds = new Decimal(0);
      for (const intermediateResult of intermediateResultsData.results) {
        totalReservedFunds = totalReservedFunds.plus(
          intermediateResult.reserved_funds,
        );
      }

      const rewardsBatches = this.calculateRewardsBatches(
        manifest,
        intermediateResultsData,
        campaign.fundTokenDecimals,
      );

      const rewardsBatchesToPay: CalculatedRewardsBatch[] = [];
      for (const rewardsBatch of rewardsBatches) {
        /**
         * All participants in batch got zero reward -> nothing to pay
         */
        if (rewardsBatch.rewards.length === 0) {
          campaignLogger.debug('Skipped zero rewards batch', {
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

          campaignLogger.debug(
            'Skipped rewards batch as per bulkPayoutsCount',
            {
              batchId: rewardsBatch.id,
              batchTotalReward: batchTotalReward.toString(),
            },
          );
          continue;
        }

        const rewardsFileName =
          await this.writeRewardsBatchToFile(rewardsBatch);
        campaignLogger.info('Got new rewards batch to pay', {
          batchId: rewardsBatch.id,
          rewardsFileName,
          githubRunId: process.env.GITHUB_RUN_ID,
          githubRunAttempt: process.env.GITHUB_RUN_ATTEMPT,
        });
        rewardsBatchesToPay.push(rewardsBatch);
      }

      if (rewardsBatchesToPay.length === 0) {
        campaignLogger.info('No new payouts for campaign');
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

        const feeParams = await this.web3Service.calculateTxFees(
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
            ...feeParams,
            nonce: latestNonce,
            timeoutMs: this.web3ConfigService.escrowTxTimeout,
          },
        );

        campaignLogger.info('Rewards batch successfully paid', {
          batchId: rewardsBatchToPay.id,
        });
      }

      campaignLogger.info('Finished payouts for campaign');

      // =================== finalization steps below ===================

      escrowStatus = await escrowClient.getStatus(campaign.address);
      escrowStatusString = EscrowStatus[escrowStatus];
      if (
        [EscrowStatus.Complete, EscrowStatus.Cancelled].includes(escrowStatus)
      ) {
        campaignLogger.info('Campaign auto-finalized during payouts', {
          escrowStatus,
          escrowStatusString,
        });
        return;
      }

      let expectedFinalLastResultsAt: string;
      if (escrowStatus === EscrowStatus.ToCancel) {
        expectedFinalLastResultsAt =
          campaign.cancellationRequestedAt!.toISOString();
      } else {
        expectedFinalLastResultsAt = manifest.end_date;
      }

      const lastResultsAt = intermediateResultsData.results
        .at(-1)!
        .to.toISOString();
      if (lastResultsAt !== expectedFinalLastResultsAt) {
        campaignLogger.info('Campaign not finished yet, skip completion', {
          lastResultsAt,
          expectedFinalLastResultsAt,
        });
        return;
      } else {
        campaignLogger.info('Campaign finished, going to finalize', {
          lastResultsAt,
          expectedFinalLastResultsAt,
        });
      }

      if (escrowStatus === EscrowStatus.ToCancel) {
        campaignLogger.info(
          'Campaign ended with cancellation request, cancelling it',
        );
        const feeParams = await this.web3Service.calculateTxFees(
          campaign.chainId,
        );
        await escrowClient.cancel(campaign.address, {
          ...feeParams,
          timeoutMs: this.web3ConfigService.escrowTxTimeout,
        });
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
        campaignLogger.info(
          'No more payouts expected for campaign, completing it',
          {
            escrowStatus,
            escrowStatusString,
          },
        );

        const feeParams = await this.web3Service.calculateTxFees(
          campaign.chainId,
        );
        await escrowClient.complete(campaign.address, {
          ...feeParams,
          timeoutMs: this.web3ConfigService.escrowTxTimeout,
        });
      } else {
        campaignLogger.warn('Unexpected campaign escrow status', {
          escrowStatus,
          escrowStatusString,
        });
      }
    } catch (error) {
      campaignLogger.error(
        'Error while running payouts cycle for campaign',
        error,
      );
    } finally {
      campaignLogger.info('Finished payouts cycle for campaign');
    }
  }

  private calculateRewardsBatches(
    manifest: CampaignManifest,
    intermediateResultsData: IntermediateResultsData,
    tokenDecimals: number,
  ): CalculatedRewardsBatch[] {
    if (manifest.type === 'COMPETITIVE_MARKET_MAKING') {
      return intermediateResultsData.results.map((intermediateResult) => {
        const calculatedRewardsBatch =
          this.calculateRewardsForCompetitiveIntermediateResult(
            intermediateResult,
            manifest as CompetitiveCampaignManifest,
            tokenDecimals,
          );

        return calculatedRewardsBatch;
      });
    }

    return intermediateResultsData.results.flatMap((intermediateResult) => {
      const calculatedRewardsBatches =
        this.calculateRewardsForIntermediateResult(
          intermediateResult,
          tokenDecimals,
        );

      return calculatedRewardsBatches;
    });
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

  private calculateRewardsForCompetitiveIntermediateResult(
    intermediateResult: IntermediateResult,
    manifest: CompetitiveCampaignManifest,
    tokenDecimals: number,
  ): CalculatedRewardsBatch {
    const eligibleOutcomes: ParticipantOutcome[] = [];
    for (const outcomesBatch of intermediateResult.participants_outcomes_batches) {
      for (const outcome of outcomesBatch.results as Required<ParticipantOutcome>[]) {
        if (
          outcome.score > 0 &&
          outcome.total_volume >= manifest.min_volume_required
        ) {
          eligibleOutcomes.push(outcome);
        }
      }
    }

    const sortedParticipantResults = _.orderBy(
      eligibleOutcomes,
      'score',
      'desc',
    );

    const sortedRewardsDistribution = _.orderBy(
      manifest.rewards_distribution,
      [],
      'desc',
    );

    const rewardPool = new Decimal(intermediateResult.reserved_funds);
    const rewards: CalculatedReward[] = [];

    let rankedResultIndex = 0;
    while (
      rankedResultIndex < sortedParticipantResults.length &&
      rankedResultIndex < sortedRewardsDistribution.length
    ) {
      const tiedResults = [sortedParticipantResults[rankedResultIndex]];

      let maybeTiedResultIndex = rankedResultIndex + 1;
      for (
        ;
        maybeTiedResultIndex < sortedParticipantResults.length;
        maybeTiedResultIndex += 1
      ) {
        const maybeTiedResult = sortedParticipantResults[maybeTiedResultIndex];
        if (maybeTiedResult.score !== tiedResults[0]!.score) {
          break;
        }
        tiedResults.push(maybeTiedResult);
      }

      const nTiedResults = tiedResults.length;
      const rewardSlots = sortedRewardsDistribution.slice(
        rankedResultIndex,
        rankedResultIndex + nTiedResults,
      );
      const totalRewardPercent = rewardSlots.reduce(
        (prev, curr) => Decimal.sum(prev, curr),
        new Decimal(0),
      );

      const rewardPerParticipant = rewardPool
        .mul(totalRewardPercent)
        .div(100)
        .div(nTiedResults)
        .toDecimalPlaces(tokenDecimals, Decimal.ROUND_DOWN);

      if (rewardPerParticipant.greaterThan(0)) {
        for (const tiedResult of tiedResults) {
          rewards.push({
            address: tiedResult.address,
            amount: rewardPerParticipant.toString(),
          });
        }
      }

      rankedResultIndex = maybeTiedResultIndex;
    }

    const batchId = `${intermediateResult.from.toISOString()}/${intermediateResult.to.toISOString()}`;

    return {
      /**
       * Use hash to avoid potential issues with special characters in file names
       */
      id: cryptoUtils.hashString(batchId, 'sha256'),
      rewards,
    };
  }

  private async uploadFinalResults(
    campaign: CampaignWithResults,
    finalResults: IntermediateResultsData,
  ): Promise<FinalResultsMeta> {
    const stringifiedResults = JSON.stringify(finalResults);
    const resultsHash = cryptoUtils.hashString(stringifiedResults, 'sha256');

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
        if (
          escrow.status === EscrowStatus[EscrowStatus.ToCancel] &&
          !escrow.cancellationRequestedAt
        ) {
          this.logger.warn(
            'ToCancel campaign is missing cancellation request date',
            {
              chainId,
              escrowAddress: escrow.address,
            },
          );
          continue;
        } else if (escrow.status !== EscrowStatus[EscrowStatus.ToCancel]) {
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
          cancellationRequestedAt: escrow.cancellationRequestedAt
            ? new Date(escrow.cancellationRequestedAt)
            : null,
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
      await EscrowUtils.getStatusEvents({
        chainId: chainId as number,
        escrowAddress,
        statuses: [EscrowStatus.Pending],
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
