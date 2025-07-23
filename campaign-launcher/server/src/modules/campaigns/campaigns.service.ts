import { EscrowUtils } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';

import { ChainId } from '@/common/constants';
import * as httpUtils from '@/common/utils/http';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { Web3Service } from '@/modules/web3';

import { CampaignData } from './campaigns.dto';
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
    }>,
  ): Promise<CampaignData[]> {
    const campaings: CampaignData[] = [];

    const campaignEscrows = await EscrowUtils.getEscrows({
      chainId: chainId as number,
      recordingOracle: this.web3ConfigService.recordingOracle,
      reputationOracle: this.web3ConfigService.reputationOracle,
      launcher: filters?.launcherAddress,
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
        address: campaignEscrow.address,
        exchangeName: manifest.exchange,
        tradingPair: manifest.pair,
        startDate: manifest.start_date.toISOString(),
        endDate: manifest.end_date.toISOString(),
        fundAmount: campaignEscrow.totalFundedAmount,
        fundToken: campaignEscrow.token,
        fundTokenSymbol: campaignTokenSymbol,
        fundTokenDecimals: campaignTokenDecimals,
        status: campaignEscrow.status,
      });
    }

    return campaings;
  }

  private async retrieveCampaignManifset(
    manifestUrlOrJson: string,
    manifestHash?: string,
  ): Promise<CampaignManifest> {
    let manifestString;
    if (httpUtils.isValidHttpUrl(manifestUrlOrJson)) {
      const manifestData = await httpUtils.downloadFileAndVerifyHash(
        manifestUrlOrJson,
        manifestHash || '',
        { algorithm: 'sha1' },
      );
      manifestString = manifestData.toString();
    } else {
      manifestString = manifestUrlOrJson;
    }

    let manifestJson: unknown;
    try {
      manifestJson = JSON.parse(manifestString);
    } catch {
      throw new Error('Manifest is not valid JSON');
    }

    return manifestUtils.validateManifest(manifestJson);
  }
}
