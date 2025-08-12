import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

import { ChainId } from '@/common/constants';
import logger from '@/logger';
import { CampaignsService, CampaignStatus } from '@/modules/campaigns';
import { Web3Service } from '@/modules/web3';

@Injectable()
export class StatisticsService {
  private readonly logger = logger.child({
    context: StatisticsService.name,
  });

  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly web3Service: Web3Service,
  ) {}

  async getCampaignsStats(chainId: ChainId): Promise<{
    nActive: number;
    rewardsPoolUsd: number;
  }> {
    let nActive = 0;
    let rewardsPoolUsd = 0;

    do {
      const campaigns = await this.campaignsService.getCampaigns(
        chainId,
        {
          status: CampaignStatus.ACTIVE,
        },
        {
          skip: nActive,
        },
      );

      if (campaigns.length === 0) {
        break;
      }

      nActive += campaigns.length;

      for (const campaign of campaigns) {
        try {
          const fundTokenPriceUsd = await this.web3Service.getTokenPriceUsd(
            campaign.fundTokenSymbol,
          );
          if (!fundTokenPriceUsd) {
            continue;
          }

          const balance = Number(
            ethers.formatUnits(campaign.fundAmount, campaign.fundTokenDecimals),
          );
          rewardsPoolUsd += balance * fundTokenPriceUsd;
        } catch {
          // noop
        }
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);

    return {
      nActive,
      rewardsPoolUsd,
    };
  }
}
