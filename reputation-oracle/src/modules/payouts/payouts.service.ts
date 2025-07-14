import { Injectable } from '@nestjs/common';

import { Web3ConfigService } from '@/config';
import logger from '@/logger';
import { Web3Service } from '@/modules/web3';

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
    this.logger.info('Running payouts cycle', {
      oracleAddress: this.web3ConfigService.operatorAddress,
      chainIds: this.web3Service.supportedChainIds,
    });
  }
}
