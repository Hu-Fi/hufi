import { EscrowUtils } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';

import { ChainId } from '@/common/constants';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { Web3Service } from '@/modules/web3';

import { CampaignData } from './types';

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
      campaings.push({
        chainId,
        address: campaignEscrow.address,
        exchangeName: 'tbd',
        tradingPair: 'tbd',
        startDate: 'tbd',
        endDate: 'tbd',
        fundAmount: campaignEscrow.totalFundedAmount,
        fundToken: campaignEscrow.token,
        fundTokenSymbol: 'tbd',
        fundTokenDecimals: -1,
        status: campaignEscrow.status,
      });
    }

    return campaings;
  }
}
