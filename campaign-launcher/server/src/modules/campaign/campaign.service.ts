import { ChainId, EscrowUtils } from '@human-protocol/sdk';
import { Injectable, Logger } from '@nestjs/common';

import { Web3Service } from '../web3/web3.service';

import { CampaignDataDto } from './campaign.dto';

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

        allCampaigns.push(...campaignsWithManifest);
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
}
