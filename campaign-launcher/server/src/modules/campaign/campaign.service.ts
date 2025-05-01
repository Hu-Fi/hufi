import { ChainId, EscrowClient, EscrowUtils } from '@human-protocol/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { v4 as uuidV4 } from 'uuid';

import { Web3Service } from '../web3/web3.service';

import { CampaignDataDto, CreateCampaignDto } from './campaign.dto';
import ERC20ABI from './ERC20.json';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(public readonly web3Service: Web3Service) {}

  public async getCampaigns(chainId = ChainId.ALL): Promise<CampaignDataDto[]> {
    let supportedChainIds = [chainId];

    if (chainId === ChainId.ALL) {
      supportedChainIds = this.web3Service.getValidChains();
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

    return allCampaigns;
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

      return {
        ...manifest,
        ...campaign,
        symbol: manifest.token.toLowerCase(),
      };
    } catch (err) {
      this.logger.error(`Failed to fetch campaign or manifest`, err);
      return undefined;
    }
  }

  public async createCampaign(
    campaignData: CreateCampaignDto,
  ): Promise<string> {
    const { chainId, tokenAddress, fundAmount, manifestUrl, manifestHash } =
      campaignData;

    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    this.logger.log(`Creating escrow on chain: ${chainId}`);
    const escrowAddress = await escrowClient.createEscrow(
      tokenAddress,
      [signer.address],
      uuidV4(),
    );
    this.logger.log(`Escrow created at address: ${escrowAddress}`);

    const fundAmountBigInt = ethers.parseUnits(fundAmount, 'ether');

    this.logger.log(`Approving and funding escrow with ${fundAmount} tokens`);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
    await (await tokenContract.approve(escrowAddress, fundAmountBigInt)).wait();
    await escrowClient.fund(escrowAddress, fundAmountBigInt);

    this.logger.log(`Setting up escrow with manifest`);
    const escrowConfig = {
      exchangeOracle: signer.address, 
      exchangeOracleFee: BigInt(this.web3Service.getExchangeOracleFee()),
      recordingOracle: this.web3Service.getRecordingOracle(),
      recordingOracleFee: BigInt(this.web3Service.getRecordingOracleFee()),
      reputationOracle: this.web3Service.getReputationOracle(),
      reputationOracleFee: BigInt(this.web3Service.getReputationOracleFee()),
      manifestUrl,
      manifestHash,
    };

    await escrowClient.setup(escrowAddress, escrowConfig);
    this.logger.log(`Escrow setup complete`);

    return escrowAddress;
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
