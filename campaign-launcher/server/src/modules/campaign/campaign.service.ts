import { ChainId, EscrowUtils, TransactionUtils } from '@human-protocol/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

import { Web3Service } from '../web3/web3.service';

import { CampaignDataDto } from './campaign.dto';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(public readonly web3Service: Web3Service) {}

  public async getCampaigns(
    chainId = ChainId.ALL,
    status?: string,
    exchangeName?: string,
    launcher?: string,
  ): Promise<CampaignDataDto[]> {
    let supportedChainIds = this.web3Service.getValidChains();

    if (chainId !== ChainId.ALL) {
      this.web3Service.validateChainId(chainId);
      supportedChainIds = [chainId];
    }

    const allCampaigns: CampaignDataDto[] = [];

    for (const supportedChainId of supportedChainIds) {
      try {
        this.logger.log(`Fetching campaigns for chainId: ${supportedChainId}`);

        const campaigns = await EscrowUtils.getEscrows({
          chainId: supportedChainId,
          recordingOracle: this.web3Service.getRecordingOracle(),
          reputationOracle: this.web3Service.getReputationOracle(),
        });
        const campaignsWithManifest = await Promise.all(
          campaigns.map(async (campaign) => {
            try {
              const url = campaign.manifestUrl?.replace(
                'http://storage.googleapis.com:80',
                'https://storage.googleapis.com',
              );

              if (!url) return undefined;

              const manifest = await fetch(url).then((res) => res.json());

              return {
                ...manifest,
                ...campaign,
                symbol: manifest.token.toLowerCase(),
                tokenSymbol: await this.web3Service.getTokenSymbol(
                  campaign.token,
                  chainId,
                ),
                tokenDecimals: await this.web3Service.getTokenDecimals(
                  campaign.token,
                  chainId,
                ),
              } as CampaignDataDto;
            } catch (err) {
              this.logger.warn(
                `Manifest fetch failed: ${campaign.manifestUrl}`,
              );
              return undefined;
            }
          }),
        );

        allCampaigns.push(
          ...campaignsWithManifest.filter((c): c is CampaignDataDto => !!c),
        );
      } catch (error) {
        this.logger.error(
          `Failed to fetch campaigns for chainId: ${supportedChainId}`,
          error,
        );
      }
    }

    return allCampaigns.filter((campaign) => {
      if (
        launcher &&
        campaign.launcher.toLowerCase() !== launcher.toLowerCase()
      ) {
        return false;
      }
      if (status && status !== 'all' && campaign.status !== status) {
        return false;
      }
      if (
        exchangeName &&
        exchangeName !== 'all' &&
        campaign.exchangeName !== exchangeName
      ) {
        return false;
      }
      return true;
    });
  }

  public async getCampaign(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<CampaignDataDto | undefined> {
    try {
      const campaign = await EscrowUtils.getEscrow(chainId, escrowAddress);

      const url = campaign.manifestUrl?.replace(
        'http://storage.googleapis.com:80',
        'https://storage.googleapis.com',
      );

      if (!url) return undefined;

      const manifest = await fetch(url).then((res) => res.json());
      const transactions = await TransactionUtils.getTransactions({
        chainId: chainId,
        fromAddress: escrowAddress,
        toAddress: escrowAddress,
      });

      const dailyMap = new Map<string, bigint>();
      transactions.forEach((tx) => {
        const date = new Date(Number(tx.timestamp) * 1000)
          .toISOString()
          .slice(0, 10);
        if (
          Array.isArray(tx.internalTransactions) &&
          tx.method === 'bulkTransfer'
        ) {
          for (const internalTx of tx.internalTransactions) {
            if (internalTx?.value) {
              const prev = dailyMap.get(date) || 0n;
              dailyMap.set(date, prev + BigInt(internalTx.value));
            }
          }
        }
      });
      const dailyArray = Array.from(dailyMap.entries()).map(
        ([date, totalAmountPaid]) => ({
          date,
          totalAmountPaid: totalAmountPaid.toString(),
        }),
      );

      return {
        ...manifest,
        ...campaign,
        dailyAmountPaid: dailyArray,
        symbol: manifest.token.toLowerCase(),
        tokenSymbol: await this.web3Service.getTokenSymbol(
          campaign.token,
          chainId,
        ),
        tokenDecimals: await this.web3Service.getTokenDecimals(
          campaign.token,
          chainId,
        ),
      };
    } catch (err) {
      this.logger.error(`Failed to fetch campaign or manifest`, err);
      return undefined;
    }
  }

  public async getCampaignStats(chainId = ChainId.ALL): Promise<{
    totalCampaigns: number;
    totalFundsUSD: number;
    averageFundingUSD: number;
    chains: {
      chainId: number;
      chainName: string;
      campaigns: number;
      totalFundsUSD: number;
      averageFundingUSD: number;
    }[];
  }> {
    const allCampaigns = await this.getCampaigns(chainId);

    // ✅ Filter only campaigns with status 'Pending' or 'Partial'
    const campaigns = allCampaigns.filter((c) =>
      ['Pending', 'Partial'].includes(c.status),
    );

    const chainGroups: Record<number, CampaignDataDto[]> = {};
    for (const campaign of campaigns) {
      if (!chainGroups[campaign.chainId]) {
        chainGroups[campaign.chainId] = [];
      }
      chainGroups[campaign.chainId].push(campaign);
    }

    let grandTotalUSD = 0;
    let grandTotalCampaigns = 0;

    const resultPerChain = await Promise.all(
      Object.entries(chainGroups).map(async ([chainIdStr, chainCampaigns]) => {
        const chainId = Number(chainIdStr);
        let chainTotalUSD = 0;

        for (const campaign of chainCampaigns) {
          const tokenAddress = campaign.token.toLowerCase();
          const rawBalance = campaign.balance ?? '0';

          try {
            const decimals = await this.web3Service.getTokenDecimals(
              tokenAddress,
              chainId,
            );
            const price = await this.web3Service.getTokenPriceUSD(
              tokenAddress,
              chainId,
            );
            const fundAmount = Number(ethers.formatUnits(rawBalance, decimals));
            const usdValue = fundAmount * price;

            chainTotalUSD += usdValue;
          } catch (err) {
            this.logger.warn(
              `Skipping campaign with unsupported token ${tokenAddress} on chain ${chainId}: ${err.message}`,
            );
          }
        }

        const campaignCount = chainCampaigns.length;
        grandTotalUSD += chainTotalUSD;
        grandTotalCampaigns += campaignCount;

        return {
          chainId,
          chainName: ChainId[chainId],
          campaigns: campaignCount,
          totalFundsUSD: parseFloat(chainTotalUSD.toFixed(2)),
          averageFundingUSD: campaignCount
            ? parseFloat((chainTotalUSD / campaignCount).toFixed(2))
            : 0,
        };
      }),
    );

    return {
      totalCampaigns: grandTotalCampaigns,
      totalFundsUSD: parseFloat(grandTotalUSD.toFixed(2)),
      averageFundingUSD: grandTotalCampaigns
        ? parseFloat((grandTotalUSD / grandTotalCampaigns).toFixed(2))
        : 0,
      chains: resultPerChain,
    };
  }
}
