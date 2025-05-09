import { ChainId, OperatorUtils } from '@human-protocol/sdk';
import { Injectable, Logger } from '@nestjs/common';

import { Web3Service } from '../web3/web3.service';

@Injectable()
export class LeaderService {
  private readonly logger = new Logger(LeaderService.name);

  constructor(public readonly web3Service: Web3Service) {}

  public async getLeader(chainId: ChainId, address: string) {
    return await OperatorUtils.getOperator(chainId, address);
  }
}
