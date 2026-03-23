import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ExchangeName, ExchangeType } from '@/common/constants';

export type ExchangeConfig = {
  enabled: boolean;
  type: ExchangeType;
  skipCcxtPreload?: true;
};

@Injectable()
export class ExchangesConfigService {
  readonly configByExchange: Record<ExchangeName, ExchangeConfig>;

  constructor(private configService: ConfigService) {
    this.configByExchange = Object.freeze({
      [ExchangeName.BIGONE]: {
        enabled: true,
        type: ExchangeType.CEX,
        skipCcxtPreload: true,
      },
      [ExchangeName.BITMART]: {
        enabled: true,
        type: ExchangeType.CEX,
      },
      [ExchangeName.BYBIT]: {
        enabled: true,
        type: ExchangeType.CEX,
      },
      [ExchangeName.GATE]: {
        enabled: true,
        type: ExchangeType.CEX,
      },
      [ExchangeName.HTX]: {
        enabled: true,
        type: ExchangeType.CEX,
      },
      [ExchangeName.HYPERLIQUID]: {
        enabled: this.isHyperliquidEnabled,
        type: ExchangeType.DEX,
      },
      [ExchangeName.MEXC]: {
        enabled: true,
        type: ExchangeType.CEX,
      },
      [ExchangeName.PANCAKESWAP]: {
        enabled: this.isPancakeswapEnabled,
        type: ExchangeType.DEX,
        skipCcxtPreload: true,
      },
      [ExchangeName.XT]: {
        enabled: true,
        type: ExchangeType.CEX,
      },
    });
  }

  get useSandbox(): boolean {
    return this.configService.get('USE_EXCHANGE_SANDBOX', '') === 'true';
  }

  private get isPancakeswapEnabled(): boolean {
    return this.configService.get('FEATURE_PANCAKESWAP', '') === 'true';
  }

  private get isHyperliquidEnabled(): boolean {
    return this.configService.get('FEATURE_HYPERLIQUID', '') === 'true';
  }

  isExchangeSupported(exchangeName: string): exchangeName is ExchangeName {
    return exchangeName in this.configByExchange;
  }

  get pancakeswapSubgraphUrl(): string {
    return this.configService.get(
      'PANCAKESWAP_SUBGRAPH_URL',
      'https://gateway.thegraph.com/api/deployments/id/QmYQLE8EzY8Jw4F5y2rEcSJ4vZJny1ipiyC6EnB2cFYWyr/indexers/id/0xbdfb5ee5a2abf4fc7bb1bd1221067aef7f9de491',
    );
  }
}
