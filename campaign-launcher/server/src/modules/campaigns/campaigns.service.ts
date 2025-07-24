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
import { CampaignManifest } from './types';

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
      status: ReadableEscrowStatus;
    }>,
  ): Promise<CampaignData[]> {
    const campaings: CampaignData[] = [];

    const campaignEscrows = await EscrowUtils.getEscrows({
      chainId: chainId as number,
      recordingOracle: this.web3ConfigService.recordingOracle,
      reputationOracle: this.web3ConfigService.reputationOracle,
      launcher: filters?.launcherAddress,
      status: filters?.status ? EscrowStatus[filters.status] : undefined,
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

      campaings.push({
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
        status: campaignEscrow.status as ReadableEscrowStatus,
        launcher: ethers.getAddress(campaignEscrow.launcher),
      });
    }

    return campaings;
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
      status: campaignEscrow.status as ReadableEscrowStatus,
      // details
      amountPaid: campaignEscrow.amountPaid,
      dailyPaidAmounts: Object.entries(amountsPerDay).map(([date, amount]) => ({
        date,
        amount: amount.toString(),
      })),
      launcher: ethers.getAddress(campaignEscrow.launcher),
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
