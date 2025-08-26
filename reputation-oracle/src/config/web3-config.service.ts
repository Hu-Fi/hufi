import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet } from 'ethers';

import { DevelopmentChainId, ProductionChainId } from '@/common/constants';

@Injectable()
export class Web3ConfigService {
  readonly operatorAddress: string;

  constructor(private configService: ConfigService) {
    const wallet = new Wallet(this.privateKey);
    this.operatorAddress = wallet.address;
  }

  /**
   * The private key used for signing transactions.
   * Required
   */
  get privateKey(): string {
    return this.configService.getOrThrow('WEB3_PRIVATE_KEY');
  }

  /**
   * Multiplier for gas price adjustments.
   * Default: 1
   */
  get gasPriceMultiplier(): number {
    return Number(this.configService.get('GAS_PRICE_MULTIPLIER')) || 1;
  }

  getRpcUrlByChainId(chainId: number): string | undefined {
    const rpcUrlsByChainId: Record<string, string | undefined> = {
      [ProductionChainId.POLYGON_MAINNET]:
        this.configService.get('RPC_URL_POLYGON'),
      [DevelopmentChainId.POLYGON_AMOY]: this.configService.get(
        'RPC_URL_POLYGON_AMOY',
      ),
      [DevelopmentChainId.SEPOLIA]: this.configService.get('RPC_URL_SEPOLIA'),
      [DevelopmentChainId.AURORA_TESTNET]: this.configService.get(
        'RPC_URL_AURORA_TESTNET',
      ),
      [DevelopmentChainId.LOCALHOST]:
        this.configService.get('RPC_URL_LOCALHOST'),
    };

    return rpcUrlsByChainId[chainId];
  }
}
