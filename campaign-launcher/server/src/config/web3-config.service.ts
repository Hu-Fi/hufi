import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DevelopmentChainId, ProductionChainId } from '@/common/constants';

@Injectable()
export class Web3ConfigService {
  constructor(private readonly configService: ConfigService) {}

  getRpcUrlByChainId(chainId: number): string | undefined {
    const rpcUrlsByChainId: Record<string, string | undefined> = {
      [ProductionChainId.POLYGON_MAINNET]:
        this.configService.get('RPC_URL_POLYGON'),
      [DevelopmentChainId.POLYGON_AMOY]: this.configService.get(
        'RPC_URL_POLYGON_AMOY',
      ),
      [ProductionChainId.ETHEREUM]: this.configService.get('RPC_URL_ETHEREUM'),
      [DevelopmentChainId.SEPOLIA]: this.configService.get('RPC_URL_SEPOLIA'),
      [DevelopmentChainId.LOCALHOST]:
        this.configService.get('RPC_URL_LOCALHOST'),
    };

    return rpcUrlsByChainId[chainId];
  }

  get recordingOracle(): string {
    return this.configService.getOrThrow<string>('RECORDING_ORACLE');
  }

  get reputationOracle(): string {
    return this.configService.getOrThrow<string>('REPUTATION_ORACLE');
  }

  get exchangeOracle(): string {
    return this.configService.getOrThrow<string>('EXCHANGE_ORACLE');
  }

  get alchemyApiKey(): string {
    return this.configService.getOrThrow('ALCHEMY_API_KEY');
  }
}
