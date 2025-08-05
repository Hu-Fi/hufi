import {
  EscrowStatus,
  EscrowUtils,
  TransactionUtils,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { ethers } from 'ethers';

import { ChainId, ReadableEscrowStatus } from '@/common/constants';
import * as httpUtils from '@/common/utils/http';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { Web3Service } from '@/modules/web3';

import { CampaignData, CampaignDataWithDetails } from './campaigns.dto';
import { InvalidCampaignManifestError } from './campaigns.errors';
import * as manifestUtils from './manifest.utils';
import { CampaignManifest, CampaignStatus } from './types';

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
      exchangeName: string;
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
      if (!campaignEscrow.manifestUrl) {
        continue;
      }

      let manifest: CampaignManifest;
      try {
        manifest = await this.retrieveCampaignManifset(
          campaignEscrow.manifestUrl,
          campaignEscrow.manifestHash,
        );
      } catch (error) {
        this.logger.error('Failed to retrieve campaign manifest', {
          chainId,
          campaignAddress: campaignEscrow.address,
          manifestUrl: campaignEscrow.manifestUrl,
          manifestHash: campaignEscrow.manifestHash,
          error,
        });
        continue;
      }

      const [campaignTokenSymbol, campaignTokenDecimals] = await Promise.all([
        this.web3Service.getTokenSymbol(chainId, campaignEscrow.token),
        this.web3Service.getTokenDecimals(chainId, campaignEscrow.token),
      ]);

      campaigns.push({
        chainId,
        address: ethers.getAddress(campaignEscrow.address),
        exchangeName: manifest.exchange,
        tradingPair: manifest.pair,
        startDate: manifest.start_date.toISOString(),
        endDate: manifest.end_date.toISOString(),
        fundAmount: campaignEscrow.totalFundedAmount,
        fundToken: ethers.getAddress(campaignEscrow.token),
        fundTokenSymbol: campaignTokenSymbol,
        fundTokenDecimals: campaignTokenDecimals,
        status: ESCROW_STATUS_TO_CAMPAIGN_STATUS[campaignEscrow.status],
        escrowStatus: campaignEscrow.status as ReadableEscrowStatus,
        launcher: ethers.getAddress(campaignEscrow.launcher),
        exchangeOracle: campaignEscrow.exchangeOracle as string,
        recordingOracle: campaignEscrow.recordingOracle as string,
        reputationOracle: campaignEscrow.reputationOracle as string,
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

    if (!campaignEscrow.manifestUrl) {
      throw new InvalidCampaignManifestError(
        chainId,
        escrowAddress,
        'Manifest url is missing',
      );
    }

    let manifest: CampaignManifest;
    try {
      manifest = await this.retrieveCampaignManifset(
        campaignEscrow.manifestUrl,
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

    const amountsPerDay: Record<string, bigint> = {};
    for (const tx of transactions) {
      let totalTransfersAmount = 0n;
      for (const internalTx of tx.internalTransactions) {
        totalTransfersAmount += BigInt(internalTx.value);
      }

      const txDate = dayjs(Number(tx.timestamp) * 1000);
      const day = txDate.format('YYYY-MM-DD');

      if (amountsPerDay[day] === undefined) {
        amountsPerDay[day] = 0n;
      }

      amountsPerDay[day] += totalTransfersAmount;
    }

    return {
      chainId,
      address: ethers.getAddress(campaignEscrow.address),
      exchangeName: manifest.exchange,
      tradingPair: manifest.pair,
      startDate: manifest.start_date.toISOString(),
      endDate: manifest.end_date.toISOString(),
      fundAmount: campaignEscrow.totalFundedAmount,
      fundToken: ethers.getAddress(campaignEscrow.token),
      fundTokenSymbol: campaignTokenSymbol,
      fundTokenDecimals: campaignTokenDecimals,
      status: ESCROW_STATUS_TO_CAMPAIGN_STATUS[campaignEscrow.status],
      escrowStatus: campaignEscrow.status as ReadableEscrowStatus,
      // details
      amountPaid: campaignEscrow.amountPaid,
      dailyPaidAmounts: Object.entries(amountsPerDay).map(([date, amount]) => ({
        date,
        amount: amount.toString(),
      })),
      launcher: ethers.getAddress(campaignEscrow.launcher),
      exchangeOracle: campaignEscrow.exchangeOracle as string,
      recordingOracle: campaignEscrow.recordingOracle as string,
      reputationOracle: campaignEscrow.reputationOracle as string,
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
}
