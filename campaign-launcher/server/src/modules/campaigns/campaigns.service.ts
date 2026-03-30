import hufiSdk, {
  CampaignOrderBy,
  OrderDirection,
  type Campaign as SubgraphCampaign,
} from '@hu-fi/subgraph-sdk';
import { EscrowClient, TransactionUtils } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import _ from 'lodash';

import { ChainId } from '@/common/constants';
import { toError } from '@/common/utils/type-guard';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { Web3Service } from '@/modules/web3';

import {
  CampaignData,
  CampaignDataWithDetails,
  CampaignDetails,
  DailyPaidAmount,
} from './campaigns.dto';
import { InvalidCampaignManifestError } from './campaigns.errors';
import * as manifestUtils from './manifest.utils';
import {
  type BaseCampaignManifest,
  type CampaignManifest,
  CampaignStatus,
  CampaignType,
  SubgraphCampaignStatus,
} from './types';

const CAMPAIGN_STATUS_TO_SUBGRAPH_CAMPAIGN_STATUS: Record<
  CampaignStatus,
  SubgraphCampaignStatus
> = {
  [CampaignStatus.ACTIVE]: SubgraphCampaignStatus.LAUNCHED,
  [CampaignStatus.TO_CANCEL]: SubgraphCampaignStatus.AWAITING_CANCELLATION,
  [CampaignStatus.CANCELLED]: SubgraphCampaignStatus.CANCELLED,
  [CampaignStatus.COMPLETED]: SubgraphCampaignStatus.COMPLETED,
};

const SUBGRAPH_CAMPAIGN_STATUS_TO_CAMPAIGN_STATUS = _.invert(
  CAMPAIGN_STATUS_TO_SUBGRAPH_CAMPAIGN_STATUS,
) as Record<SubgraphCampaignStatus, CampaignStatus>;

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
    }>,
    pagination?: Partial<{
      skip: number;
      limit: number;
    }>,
  ): Promise<CampaignData[]> {
    let statuses: SubgraphCampaignStatus[] = [];
    if (filters?.statuses) {
      statuses = filters.statuses.map(
        (status) => CAMPAIGN_STATUS_TO_SUBGRAPH_CAMPAIGN_STATUS[status],
      );
    }

    const subgraphCampaigns = await hufiSdk.getCampaigns(chainId, {
      filters: {
        exchangeOracleAddress: this.web3ConfigService.exchangeOracle,
        recordingOracleAddress: this.web3ConfigService.recordingOracle,
        reputationOracleAddress: this.web3ConfigService.reputationOracle,
        creatorAddress: filters?.launcherAddress,
        status_in: statuses.length > 0 ? statuses : undefined,
      },
      first: pagination?.limit,
      skip: pagination?.skip,
      orderBy: CampaignOrderBy.CREATED_AT,
      orderDirection: OrderDirection.DESC,
    });

    const campaigns: CampaignData[] = [];
    for (const subgraphCampaign of subgraphCampaigns) {
      let campaignData: CampaignData;
      try {
        campaignData = await this.retrieveCampaignData(
          chainId,
          subgraphCampaign,
        );
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
    campaignAddress: string,
  ): Promise<CampaignDataWithDetails | null> {
    const hufiCampaign = await hufiSdk.getCampaign(chainId, campaignAddress);
    if (!hufiCampaign) {
      return null;
    }

    const [campaignData, reservedFunds] = await Promise.all([
      this.retrieveCampaignData(chainId, hufiCampaign),
      this.getReservedFunds(chainId, hufiCampaign),
    ]);

    return {
      ...campaignData,
      // details
      exchangeOracleFeePercent: hufiCampaign.exchangeOracleFee,
      recordingOracleFeePercent: hufiCampaign.recordingOracleFee,
      reputationOracleFeePercent: hufiCampaign.reputationOracleFee,
      reservedFunds: reservedFunds.toString(),
    };
  }

  async getCampaignDailyPaidAmounts(
    chainId: ChainId,
    campaignAddress: string,
  ): Promise<Array<DailyPaidAmount>> {
    const amountsPerDay: Record<string, bigint> = {};
    let nTxsChecked = 0;
    do {
      const transactions = await TransactionUtils.getTransactions({
        chainId: chainId as number,
        fromAddress: campaignAddress,
        toAddress: campaignAddress,
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

    return Object.entries(amountsPerDay).map(([date, amount]) => ({
      date,
      amount: amount.toString(),
    }));
  }

  private async retrieveCampaignData(
    chainId: number,
    subgraphCampaign: SubgraphCampaign,
  ): Promise<CampaignData> {
    let manifest: CampaignManifest;
    try {
      manifest = manifestUtils.validateSchema(
        JSON.parse(subgraphCampaign.manifest),
      );
    } catch (error) {
      throw new InvalidCampaignManifestError(
        chainId,
        subgraphCampaign.id,
        toError(error).message,
      );
    }

    let details: CampaignDetails;
    let symbol: string;

    if (manifestUtils.isMarketMakingManifest(manifest)) {
      symbol = manifest.pair;
      details = {
        dailyVolumeTarget: manifest.daily_volume_target,
      };
    } else if (manifestUtils.isCompetitiveMarketMakingManifest(manifest)) {
      symbol = manifest.pair;
      details = {
        rewardsDistribution: manifest.rewards_distribution,
        minVolumeRequired: manifest.min_volume_required,
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
        maxParticipants: manifest.max_participants,
      };
    } else {
      // Should not happen at this point, just for typescript types
      throw new InvalidCampaignManifestError(
        chainId,
        subgraphCampaign.id,
        `Unknown campaign type: ${(manifest as BaseCampaignManifest).type}`,
      );
    }

    const [campaignTokenSymbol, campaignTokenDecimals] = await Promise.all([
      this.web3Service.getTokenSymbol(
        chainId,
        subgraphCampaign.fundTokenAddress,
      ),
      this.web3Service.getTokenDecimals(
        chainId,
        subgraphCampaign.fundTokenAddress,
      ),
    ]);

    return {
      chainId,
      address: subgraphCampaign.id,
      type: manifest.type as CampaignType,
      exchangeName: manifest.exchange,
      symbol,
      details,
      startDate: manifest.start_date.toISOString(),
      endDate: manifest.end_date.toISOString(),
      fundAmount: subgraphCampaign.fundAmount.toString(),
      fundToken: subgraphCampaign.fundTokenAddress,
      fundTokenSymbol: campaignTokenSymbol,
      fundTokenDecimals: campaignTokenDecimals,
      status:
        SUBGRAPH_CAMPAIGN_STATUS_TO_CAMPAIGN_STATUS[
          subgraphCampaign.status as SubgraphCampaignStatus
        ],
      launcher: subgraphCampaign.creatorAddress,
      exchangeOracle: subgraphCampaign.exchangeOracleAddress,
      recordingOracle: subgraphCampaign.recordingOracleAddress,
      reputationOracle: subgraphCampaign.reputationOracleAddress,
      balance: subgraphCampaign.currentBalance.toString(),
      amountPaid: subgraphCampaign.rewardsDistributed.toString(),
      intermediateResultsUrl: subgraphCampaign.intermediateResultsUrl,
      finalResultsUrl: subgraphCampaign.finalResultsUrl,
      createdAt: subgraphCampaign.createdAt,
    };
  }

  private async getReservedFunds(
    chainId: number,
    subgraphCampaign: SubgraphCampaign,
  ): Promise<bigint> {
    try {
      if (
        [
          SubgraphCampaignStatus.CANCELLED,
          SubgraphCampaignStatus.COMPLETED,
        ].includes(subgraphCampaign.status as SubgraphCampaignStatus)
      ) {
        return 0n;
      }

      const provider = this.web3Service.getProvider(chainId);
      const escrowClient = await EscrowClient.build(provider);
      const reservedFunds = await escrowClient.getReservedFunds(
        subgraphCampaign.id,
      );

      return reservedFunds;
    } catch (error) {
      const message = 'Failed to get reserved funds';
      this.logger.error(message, {
        chainId,
        campaignAddress: subgraphCampaign.id,
        error,
      });
      throw new Error(message);
    }
  }
}
