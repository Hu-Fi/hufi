import { EscrowStatus, EscrowUtils, IEscrowsFilter } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';

import type { ChainId } from '@/common/constants';
import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { Web3Service } from '@/modules/web3';

import { CampaignWithResults } from './types';

@Injectable()
export class PayoutsService {
  private readonly logger = logger.child({
    context: PayoutsService.name,
  });

  constructor(
    private readonly web3ConfigService: Web3ConfigService,
    private readonly web3Service: Web3Service,
  ) {}

  async runPayoutsCycle(): Promise<void> {
    this.logger.info('Going to run payouts cycle', {
      supportedChainIds: this.web3Service.supportedChainIds,
    });

    for (const chainId of this.web3Service.supportedChainIds) {
      const logger = this.logger.child({ chainId });
      logger.info('Running payouts cycle for chain');

      const campaigns = await this.getCampaignsForPayouts(chainId);
      logger.info('Found campaigns waiting for payouts', {
        campaigns: campaigns.map((c) => c.address),
      });

      logger.info('Finished payouts cycle for chain');
    }

    this.logger.info('Payouts cycle finished');
  }

  private async getCampaignsForPayouts(
    chainId: ChainId,
  ): Promise<CampaignWithResults[]> {
    const baseFilter: IEscrowsFilter = {
      chainId: chainId as number,
      reputationOracle: this.web3ConfigService.operatorAddress,
    };

    const [pendingEscrows, partialEscrows] = await Promise.all([
      EscrowUtils.getEscrows({
        ...baseFilter,
        status: EscrowStatus.Pending,
      }),
      EscrowUtils.getEscrows({
        ...baseFilter,
        status: EscrowStatus.Partial,
      }),
    ]);

    const campaignsWithResults: CampaignWithResults[] = [];
    for (const escrow of [...pendingEscrows, ...partialEscrows]) {
      if (!escrow.intermediateResultsUrl) {
        continue;
      }

      campaignsWithResults.push({
        chainId: escrow.chainId,
        address: escrow.address,
        manifestUrl: escrow.manifestUrl as string,
        manifestHash: escrow.manifestHash as string,
        intermediateResultsUrl: escrow.intermediateResultsUrl as string,
      });
    }

    return campaignsWithResults;
  }
}
