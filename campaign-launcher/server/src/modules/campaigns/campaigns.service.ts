import { Escrow__factory } from '@human-protocol/core/typechain-types';
import {
  EscrowStatus,
  EscrowUtils,
  TransactionUtils,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { LRUCache } from 'lru-cache';

import { ChainId, ReadableEscrowStatus } from '@/common/constants';
import * as httpUtils from '@/common/utils/http';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { Web3Service } from '@/modules/web3';

import { CampaignData, CampaignDataWithDetails } from './campaigns.dto';
import { InvalidCampaignManifestError } from './campaigns.errors';
import * as manifestUtils from './manifest.utils';
import { CampaignManifest, CampaignOracleFees, CampaignStatus } from './types';

const CAMPAIGN_STATUS_TO_ESCROW_STATUSES: Record<
  CampaignStatus,
  EscrowStatus[]
> = {
  [CampaignStatus.ACTIVE]: [EscrowStatus.Pending, EscrowStatus.Partial],
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

const campaignOraclesFeesCache = new LRUCache<string, CampaignOracleFees>({
  max: 1000,
});

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
      status: CampaignStatus;
    }>,
    pagination?: Partial<{
      skip: number;
      limit: number;
    }>,
  ): Promise<CampaignData[]> {
    const campaigns: CampaignData[] = [];

    let statuses: EscrowStatus[] | undefined;
    if (filters?.status) {
      statuses = CAMPAIGN_STATUS_TO_ESCROW_STATUSES[filters.status];
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
    });

    for (const campaignEscrow of campaignEscrows) {
      if (!campaignEscrow.manifest) {
        continue;
      }

      let manifest: CampaignManifest;
      try {
        manifest = await this.retrieveCampaignManifset(
          campaignEscrow.manifest,
          campaignEscrow.manifestHash,
        );
      } catch (error) {
        this.logger.error('Failed to retrieve campaign manifest', {
          chainId,
          campaignAddress: campaignEscrow.address,
          manifest: campaignEscrow.manifest,
          manifestHash: campaignEscrow.manifestHash,
          error,
        });
        continue;
      }

      const [campaignTokenSymbol, campaignTokenDecimals] = await Promise.all([
        this.web3Service.getTokenSymbol(chainId, campaignEscrow.token),
        this.web3Service.getTokenDecimals(chainId, campaignEscrow.token),
      ]);

      const reservedFunds = await this.getReservedFunds(
        chainId,
        campaignEscrow.address,
      );

      campaigns.push({
        chainId,
        address: ethers.getAddress(campaignEscrow.address),
        exchangeName: manifest.exchange,
        tradingPair: manifest.pair,
        dailyVolumeTarget: manifest.daily_volume_target,
        startDate: manifest.start_date.toISOString(),
        endDate: manifest.end_date.toISOString(),
        fundAmount: campaignEscrow.totalFundedAmount,
        fundToken: ethers.getAddress(campaignEscrow.token),
        fundTokenSymbol: campaignTokenSymbol,
        fundTokenDecimals: campaignTokenDecimals,
        status: ESCROW_STATUS_TO_CAMPAIGN_STATUS[campaignEscrow.status],
        escrowStatus: campaignEscrow.status as ReadableEscrowStatus,
        reservedFunds,
        launcher: ethers.getAddress(campaignEscrow.launcher),
        exchangeOracle: campaignEscrow.exchangeOracle as string,
        recordingOracle: campaignEscrow.recordingOracle as string,
        reputationOracle: campaignEscrow.reputationOracle as string,
        balance: campaignEscrow.balance,
      });
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

    if (!campaignEscrow.manifest) {
      throw new InvalidCampaignManifestError(
        chainId,
        escrowAddress,
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
        escrowAddress,
        error.message as string,
      );
    }

    const [campaignTokenSymbol, campaignTokenDecimals] = await Promise.all([
      this.web3Service.getTokenSymbol(chainId, campaignEscrow.token),
      this.web3Service.getTokenDecimals(chainId, campaignEscrow.token),
    ]);

    const transactions = await TransactionUtils.getTransactions({
      chainId: chainId as number,
      fromAddress: escrowAddress,
      toAddress: escrowAddress,
      method: 'bulkTransfer',
    });

    let totalTransfersAmount = 0n;
    const amountsPerDay: Record<string, bigint> = {};
    for (const tx of transactions) {
      let totalTransfersAmountInTx = 0n;
      for (const internalTx of tx.internalTransactions) {
        totalTransfersAmountInTx += BigInt(internalTx.value);
      }

      const txDate = dayjs(Number(tx.timestamp) * 1000);
      const day = txDate.format('YYYY-MM-DD');

      if (amountsPerDay[day] === undefined) {
        amountsPerDay[day] = 0n;
      }

      amountsPerDay[day] += totalTransfersAmountInTx;
      totalTransfersAmount += totalTransfersAmountInTx;
    }

    /**
     * Temporary workaround until we have this data in subgraph
     */
    const oracleFees = await this.getCampaignOracleFees(chainId, escrowAddress);

    const reservedFunds = await this.getReservedFunds(chainId, escrowAddress);

    return {
      chainId,
      address: ethers.getAddress(escrowAddress),
      exchangeName: manifest.exchange,
      tradingPair: manifest.pair,
      dailyVolumeTarget: manifest.daily_volume_target,
      startDate: manifest.start_date.toISOString(),
      endDate: manifest.end_date.toISOString(),
      fundAmount: campaignEscrow.totalFundedAmount,
      fundToken: ethers.getAddress(campaignEscrow.token),
      fundTokenSymbol: campaignTokenSymbol,
      fundTokenDecimals: campaignTokenDecimals,
      status: ESCROW_STATUS_TO_CAMPAIGN_STATUS[campaignEscrow.status],
      escrowStatus: campaignEscrow.status as ReadableEscrowStatus,
      reservedFunds,
      // details
      amountPaid: totalTransfersAmount.toString(),
      dailyPaidAmounts: Object.entries(amountsPerDay).map(([date, amount]) => ({
        date,
        amount: amount.toString(),
      })),
      launcher: ethers.getAddress(campaignEscrow.launcher),
      exchangeOracle: campaignEscrow.exchangeOracle as string,
      recordingOracle: campaignEscrow.recordingOracle as string,
      reputationOracle: campaignEscrow.reputationOracle as string,
      balance: campaignEscrow.balance,
      exchangeOracleFeePercent: oracleFees.exchangeOracleFee,
      recordingOracleFeePercent: oracleFees.recordingOracleFee,
      reputationOracleFeePercent: oracleFees.reputationOracleFee,
    };
  }

  private async retrieveCampaignManifset(
    manifestUrlOrJson: string,
    manifestHash?: string,
  ): Promise<CampaignManifest> {
    let manifestString;
    if (httpUtils.isValidHttpUrl(manifestUrlOrJson)) {
      manifestString = await manifestUtils.donwload(
        manifestUrlOrJson,
        manifestHash as string,
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

  private async getCampaignOracleFees(
    chainId: ChainId,
    campaignAddress: string,
  ): Promise<CampaignOracleFees> {
    const cacheKey = `${chainId}-${campaignAddress}`.toLowerCase();

    if (!campaignOraclesFeesCache.has(cacheKey)) {
      try {
        const provider = this.web3Service.getProvider(chainId);
        const escrowContract = Escrow__factory.connect(
          campaignAddress,
          provider,
        );

        const [
          exchangeOracleFeePercentage,
          recordingOracleFeePercentage,
          reputationOracleFeePercentage,
        ] = await Promise.all([
          escrowContract.exchangeOracleFeePercentage(),
          escrowContract.recordingOracleFeePercentage(),
          escrowContract.reputationOracleFeePercentage(),
        ]);

        campaignOraclesFeesCache.set(cacheKey, {
          exchangeOracleFee: Number(exchangeOracleFeePercentage),
          recordingOracleFee: Number(recordingOracleFeePercentage),
          reputationOracleFee: Number(reputationOracleFeePercentage),
        });
      } catch (error) {
        const message = 'Failed to get oracles fees';
        this.logger.error(message, {
          chainId,
          campaignAddress,
          error,
        });
        throw new Error(message);
      }
    }

    return campaignOraclesFeesCache.get(cacheKey) as CampaignOracleFees;
  }

  private async getReservedFunds(
    chainId: ChainId,
    campaignAddress: string,
  ): Promise<string> {
    try {
      const provider = this.web3Service.getProvider(chainId);
      const escrowContract = Escrow__factory.connect(campaignAddress, provider);

      const reservedFunds = await escrowContract.reservedFunds();

      return reservedFunds.toString();
    } catch (error) {
      const message = 'Failed to get oracles fees';
      this.logger.error(message, {
        chainId,
        campaignAddress,
        error,
      });
      throw new Error(message);
    }
  }
}
