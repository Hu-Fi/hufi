import { Injectable } from '@nestjs/common';

import logger from '@/logger';
import { Web3Service } from '@/modules/web3';

@Injectable()
export class CampaignsService {
  private readonly logger = logger.child({ context: CampaignsService.name });

  constructor(private readonly web3Service: Web3Service) {}

  async getCampaigns() {
    return this.web3Service.supportedChainIds;
  }
}
