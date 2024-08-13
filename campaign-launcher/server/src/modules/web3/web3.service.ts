import { ChainId } from '@human-protocol/sdk';
import { Injectable, Logger } from '@nestjs/common';

import { Web3ConfigService } from '../../common/config/web3-config.service';
import {
  LOCALHOST_CHAIN_IDS,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
} from '../../common/constants/networks';
import { Web3Env } from '../../common/enums/web3';

@Injectable()
export class Web3Service {
  public readonly logger = new Logger(Web3Service.name);

  constructor(private readonly web3ConfigService: Web3ConfigService) {}

  public getValidChains(): ChainId[] {
    switch (this.web3ConfigService.env) {
      case Web3Env.MAINNET:
        return MAINNET_CHAIN_IDS;
      case Web3Env.TESTNET:
        return TESTNET_CHAIN_IDS;
      case Web3Env.LOCALHOST:
        return LOCALHOST_CHAIN_IDS;
      default:
        return LOCALHOST_CHAIN_IDS;
    }
  }

  public getRecordingOracle(): string {
    return this.web3ConfigService.recordingOracle;
  }

  public getReputationOracle(): string {
    return this.web3ConfigService.reputationOracle;
  }
}
