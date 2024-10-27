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

    const allCampaigns = [];

    for (const supportedChainId of supportedChainIds) {
      try {
        this.logger.log(`Fetching campaigns for chainId: ${supportedChainId}`);

        const campaigns = await EscrowUtils.getEscrows({
          chainId: supportedChainId,
          recordingOracle: this.web3Service.getRecordingOracle(),
          reputationOracle: this.web3Service.getReputationOracle(),
        });

        const campaignsWithManifest: Array<CampaignDataDto | undefined> =
          await Promise.all(
            campaigns.map(async (campaign) => {
              let manifest;

              try {
                if (campaign.manifestUrl) {
                  // @dev Temporary fix to handle http/https issue
                  const url = campaign.manifestUrl.replace(
                    'http://storage.googleapis.com:80',
                    'https://storage.googleapis.com',
                  );
                  manifest = await fetch(url).then((res) => res.json());
                }
              } catch {
                manifest = undefined;
              }

              if (!manifest) {
                return undefined;
              }

              return {
                ...manifest,
                ...campaign,
                symbol: manifest.token.toLowerCase(),
              };
            }),
          );

        allCampaigns.push(
          ...campaignsWithManifest.filter((campaign) => !!campaign),
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

  public async getCampaign(chainId: ChainId, escrowAddress: string) {
    const campaign = await EscrowUtils.getEscrow(chainId, escrowAddress);

    let manifest;

    try {
      if (campaign.manifestUrl) {
        // @dev Temporary fix to handle http/https issue
        const url = campaign.manifestUrl.replace(
          'http://storage.googleapis.com:80',
          'https://storage.googleapis.com',
        );
        manifest = await fetch(url).then((res) => res.json());
      }
    } catch {
      manifest = undefined;
    }

    if (!manifest) {
      return undefined;
    }

    return {
      ...manifest,
      ...campaign,
      symbol: manifest.token.toLowerCase(),
    };
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

    this.logger.log(`Funding escrow with ${fundAmount} tokens`);
    const fundAmountBigInt = ethers.parseUnits(fundAmount, 'ether');
    const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
    await (await tokenContract.approve(escrowAddress, fundAmountBigInt)).wait();

    await escrowClient.fund(escrowAddress, fundAmountBigInt);
    this.logger.log(`Escrow funded successfully`);

    this.logger.log(`Setting up escrow with manifest`);
    const escrowConfig = {
      exchangeOracle: this.web3Service.getExchangeOracle(),
      exchangeOracleFee: BigInt(this.web3Service.getExchangeOracleFee()),
      recordingOracle: this.web3Service.getRecordingOracle(),
      recordingOracleFee: BigInt(this.web3Service.getRecordingOracleFee()),
      reputationOracle: this.web3Service.getReputationOracle(),
      reputationOracleFee: BigInt(this.web3Service.getReputationOracleFee()),
      manifestUrl,
      manifestHash,
    };
    await escrowClient.setup(escrowAddress, escrowConfig);
    this.logger.log(`Escrow setup successfully`);

    return escrowAddress;
  }
}
