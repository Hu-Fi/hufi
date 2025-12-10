import {
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  type IEscrow,
  TransactionUtils,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { ethers } from 'ethers';
import _ from 'lodash';

import { ChainId, ReadableEscrowStatus } from '@/common/constants';
import * as httpUtils from '@/common/utils/http';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { Web3Service } from '@/modules/web3';

import {
  CampaignData,
  CampaignDataWithDetails,
  CampaignDetails,
  LeaderboardEntry,
} from './campaigns.dto';
import {
  CampaignEscrowNotFoundError,
  InvalidCampaignManifestError,
} from './campaigns.errors';
import * as manifestUtils from './manifest.utils';
import {
  CampaignManifest,
  CampaignStatus,
  CampaignType,
  IntermediateResultsData,
} from './types';

const CAMPAIGN_STATUS_TO_ESCROW_STATUSES: Record<
  CampaignStatus,
  EscrowStatus[]
> = {
  [CampaignStatus.ACTIVE]: [EscrowStatus.Pending, EscrowStatus.Partial],
  [CampaignStatus.TO_CANCEL]: [EscrowStatus.ToCancel],
  [CampaignStatus.CANCELLED]: [EscrowStatus.Cancelled],
  [CampaignStatus.COMPLETED]: [EscrowStatus.Complete],
};

const ESCROW_STATUS_TO_CAMPAIGN_STATUS: Record<string, CampaignStatus> = {};
for (const [campaignStatus, escrowStatuses] of Object.entries(
  CAMPAIGN_STATUS_TO_ESCROW_STATUSES,
)) {
  for (const escrowStatus of escrowStatuses) {
    ESCROW_STATUS_TO_CAMPAIGN_STATUS[EscrowStatus[escrowStatus]] =
      campaignStatus as CampaignStatus;
  }
}

@Injectable()
export class CampaignsService {
  private readonly logger = logger.child({ context: CampaignsService.name });

  constructor(
    private readonly web3ConfigService: Web3ConfigService,
    private readonly web3Service: Web3Service,
  ) {}

  async getCampaigns(
    chainId: ChainId,
    filters?: Partial<{
      launcherAddress: string;
      statuses: CampaignStatus[];
      since: Date;
    }>,
    pagination?: Partial<{
      skip: number;
      limit: number;
    }>,
  ): Promise<CampaignData[]> {
    const campaigns: CampaignData[] = [];

    let statuses: EscrowStatus[] | undefined;
    if (filters?.statuses?.length) {
      statuses = filters.statuses.flatMap(
        (status) => CAMPAIGN_STATUS_TO_ESCROW_STATUSES[status],
      );
    }
    const campaignEscrows = await EscrowUtils.getEscrows({
      chainId: chainId as number,
      exchangeOracle: this.web3ConfigService.exchangeOracle,
      recordingOracle: this.web3ConfigService.recordingOracle,
      reputationOracle: this.web3ConfigService.reputationOracle,
      launcher: filters?.launcherAddress,
      status: statuses,
      first: pagination?.limit,
      skip: pagination?.skip,
      from: filters?.since,
    });

    for (const campaignEscrow of campaignEscrows) {
      let campaignData: CampaignData;
      try {
        campaignData = await this.retrieveCampaignData(campaignEscrow);
      } catch (error) {
        if (error instanceof InvalidCampaignManifestError) {
          continue;
        }
        throw error;
      }

      campaigns.push(campaignData);
    }

    return campaigns;
  }

  async getCampaignWithDetails(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<CampaignDataWithDetails | null> {
    const campaignEscrow = await EscrowUtils.getEscrow(
      chainId as number,
      escrowAddress,
    );

    if (!campaignEscrow) {
      return null;
    }

    const campaignData = await this.retrieveCampaignData(campaignEscrow);

    const amountsPerDay: Record<string, bigint> = {};
    let nTxsChecked = 0;
    do {
      const transactions = await TransactionUtils.getTransactions({
        chainId: chainId as number,
        fromAddress: escrowAddress,
        toAddress: escrowAddress,
        method: 'bulkTransfer',
        first: 100,
        skip: nTxsChecked,
      });

      if (transactions.length === 0) {
        break;
      }

      for (const tx of transactions) {
        let totalTransfersAmountInTx = 0n;
        for (const internalTx of tx.internalTransactions) {
          totalTransfersAmountInTx += internalTx.value;
        }

        const day = dayjs(tx.timestamp).format('YYYY-MM-DD');

        if (amountsPerDay[day] === undefined) {
          amountsPerDay[day] = 0n;
        }

        amountsPerDay[day] += totalTransfersAmountInTx;
      }

      nTxsChecked += transactions.length;
      // eslint-disable-next-line no-constant-condition
    } while (true);

    const reservedFunds = await this.getReservedFunds(campaignEscrow);

    return {
      ...campaignData,
      // details
      dailyPaidAmounts: Object.entries(amountsPerDay).map(([date, amount]) => ({
        date,
        amount: amount.toString(),
      })),
      exchangeOracleFeePercent: campaignEscrow.exchangeOracleFee as number,
      recordingOracleFeePercent: campaignEscrow.recordingOracleFee as number,
      reputationOracleFeePercent: campaignEscrow.reputationOracleFee as number,
      reservedFunds: reservedFunds.toString(),
    };
  }

  private async retrieveCampaignManifset(
    manifestUrlOrJson: string,
    manifestHash: string,
  ): Promise<CampaignManifest> {
    let manifestString;
    if (httpUtils.isValidHttpUrl(manifestUrlOrJson)) {
      manifestString = await manifestUtils.donwload(
        manifestUrlOrJson,
        manifestHash,
      );
    } else {
      manifestString = manifestUrlOrJson;
    }

    let manifestJson: unknown;
    try {
      manifestJson = JSON.parse(manifestString);
    } catch {
      throw new Error('Manifest is not valid JSON');
    }

    return manifestUtils.validateSchema(manifestJson);
  }

  /**
   * TODO: cache successful retrievals
   */
  private async retrieveCampaignData(
    campaignEscrow: IEscrow,
  ): Promise<CampaignData> {
    const chainId = campaignEscrow.chainId;
    const address = ethers.getAddress(campaignEscrow.address);

    if (!campaignEscrow.manifest || !campaignEscrow.manifestHash) {
      throw new InvalidCampaignManifestError(
        chainId,
        address,
        'Manifest is missing',
      );
    }

    let manifest: CampaignManifest;
    try {
      manifest = await this.retrieveCampaignManifset(
        campaignEscrow.manifest,
        campaignEscrow.manifestHash,
      );
    } catch (error) {
      throw new InvalidCampaignManifestError(
        chainId,
        address,
        error.message as string,
      );
    }

    let details: CampaignDetails;
    let symbol: string;

    if (manifestUtils.isMarketMakingManifest(manifest)) {
      symbol = manifest.pair;
      details = {
        dailyVolumeTarget: manifest.daily_volume_target,
      };
    } else if (manifestUtils.isHoldingManifest(manifest)) {
      symbol = manifest.symbol;
      details = {
        dailyBalanceTarget: manifest.daily_balance_target,
      };
    } else if (manifestUtils.isThresholdManifest(manifest)) {
      symbol = manifest.symbol;
      details = {
        minimumBalanceTarget: manifest.minimum_balance_target,
      };
    } else {
      // Should not happen at this point, just for typescript types
      throw new InvalidCampaignManifestError(
        chainId,
        address,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Unknown campaign type: ${(manifest as any).type}`,
      );
    }

    const fundToken = ethers.getAddress(campaignEscrow.token);
    const [campaignTokenSymbol, campaignTokenDecimals] = await Promise.all([
      this.web3Service.getTokenSymbol(chainId, fundToken),
      this.web3Service.getTokenDecimals(chainId, fundToken),
    ]);

    return {
      chainId,
      address,
      type: manifest.type as CampaignType,
      exchangeName: manifest.exchange,
      symbol,
      details,
      startDate: manifest.start_date.toISOString(),
      endDate: manifest.end_date.toISOString(),
      fundAmount: campaignEscrow.totalFundedAmount.toString(),
      fundToken,
      fundTokenSymbol: campaignTokenSymbol,
      fundTokenDecimals: campaignTokenDecimals,
      status: ESCROW_STATUS_TO_CAMPAIGN_STATUS[campaignEscrow.status],
      escrowStatus: campaignEscrow.status as ReadableEscrowStatus,
      launcher: ethers.getAddress(campaignEscrow.launcher),
      exchangeOracle: campaignEscrow.exchangeOracle as string,
      recordingOracle: campaignEscrow.recordingOracle as string,
      reputationOracle: campaignEscrow.reputationOracle as string,
      balance: campaignEscrow.balance.toString(),
      amountPaid: campaignEscrow.amountPaid.toString(),
      intermediateResultsUrl: campaignEscrow.intermediateResultsUrl,
      finalResultsUrl: campaignEscrow.finalResultsUrl,
      createdAt: campaignEscrow.createdAt,
    };
  }

  private async getReservedFunds(escrow: IEscrow): Promise<bigint> {
    try {
      /**
       * This is to eliminate escrows that have been
       * completed before `reservedFunds()` were introduced.
       * We know for sure that there will be no escrows
       * in these statuses when contracts are upgraded.
       */
      const escrowStatus =
        EscrowStatus[escrow.status as keyof typeof EscrowStatus];
      if (
        ![
          EscrowStatus.Pending,
          EscrowStatus.Partial,
          EscrowStatus.ToCancel,
        ].includes(escrowStatus)
      ) {
        return 0n;
      }

      const provider = this.web3Service.getProvider(escrow.chainId);
      const escrowClient = await EscrowClient.build(provider);
      const reservedFunds = await escrowClient.getReservedFunds(escrow.address);

      return reservedFunds;
    } catch (error) {
      const message = 'Failed to get reserved funds';
      this.logger.error(message, {
        chainId: escrow.chainId,
        campaignAddress: escrow.address,
        error,
      });
      throw new Error(message);
    }
  }

  /**
   * TODO: add caching
   */
  async getCampaignLeaderboard(
    chainId: ChainId,
    address: string,
  ): Promise<LeaderboardEntry[]> {
    const campaignEscrow = await EscrowUtils.getEscrow(
      chainId as number,
      address,
    );

    if (!campaignEscrow) {
      throw new CampaignEscrowNotFoundError(chainId, address);
    }

    /**
     * If no intermediates results file yet - no entries for leaderboard
     */
    if (!campaignEscrow.intermediateResultsUrl) {
      return [];
    }

    const campaignData = await this.retrieveCampaignData(campaignEscrow);

    let intermediateResultsData: IntermediateResultsData;
    try {
      const intermediateResultsFile = await httpUtils.downloadFile(
        campaignEscrow.intermediateResultsUrl,
      );
      intermediateResultsData = JSON.parse(intermediateResultsFile.toString());
    } catch (error) {
      this.logger.error(
        'Failed to get intermediate results data for leaderboard',
        {
          chainId,
          address,
          error,
        },
      );
      throw new Error('Failed to retrieve results for leaderboard');
    }

    const leaderboardEntriesMap = new Map<
      string,
      { score: Decimal; rewards: 0n }
    >();

    for (const intermediateResult of intermediateResultsData.results) {
      for (const outcomesBatch of intermediateResult.participants_outcomes_batches) {
        for (const participantOutcome of outcomesBatch.results) {
          if (!leaderboardEntriesMap.has(participantOutcome.address)) {
            leaderboardEntriesMap.set(participantOutcome.address, {
              score: new Decimal(0),
              rewards: 0n,
            });
          }

          const participantEntry = leaderboardEntriesMap.get(
            participantOutcome.address,
          )!;
          participantEntry.score = participantEntry.score.add(
            participantOutcome.score,
          );
        }
      }
    }

    const leaderboardEntries: LeaderboardEntry[] = [];
    for (const [address, entryData] of leaderboardEntriesMap.entries()) {
      leaderboardEntries.push({
        address,
        score: Number(
          entryData.score.toDecimalPlaces(
            campaignData.fundTokenDecimals,
            Decimal.ROUND_DOWN,
          ),
        ),
        rewards: Number(
          ethers.formatUnits(entryData.rewards, campaignData.fundTokenDecimals),
        ),
      });
    }

    return _.orderBy(leaderboardEntries, 'score', 'desc');
  }
}
