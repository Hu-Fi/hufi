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
        enabled: this.configService.get('FEATURE_BIGONE', 'true') === 'true',
        type: ExchangeType.CEX,
        skipCcxtPreload: true,
      },
      [ExchangeName.BITMART]: {
        enabled: this.configService.get('FEATURE_BITMART', 'true') === 'true',
        type: ExchangeType.CEX,
      },
      [ExchangeName.BYBIT]: {
        enabled: this.configService.get('FEATURE_BYBIT', 'true') === 'true',
        type: ExchangeType.CEX,
      },
      [ExchangeName.GATE]: {
        enabled: this.configService.get('FEATURE_GATE', 'true') === 'true',
        type: ExchangeType.CEX,
      },
      [ExchangeName.HTX]: {
        enabled: this.configService.get('FEATURE_HTX', 'true') === 'true',
        type: ExchangeType.CEX,
      },
      [ExchangeName.HYPERLIQUID]: {
        enabled:
          this.configService.get('FEATURE_HYPERLIQUID', 'true') === 'true',
        type: ExchangeType.DEX,
      },
      [ExchangeName.MEXC]: {
        enabled: this.configService.get('FEATURE_MEXC', 'true') === 'true',
        type: ExchangeType.CEX,
      },
      [ExchangeName.KRAKEN]: {
        enabled: this.configService.get('FEATURE_KRAKEN', 'true') === 'true',
        type: ExchangeType.CEX,
        skipCcxtPreload: true,
      },
      [ExchangeName.PANCAKESWAP]: {
        enabled:
          this.configService.get('FEATURE_PANCAKESWAP', 'true') === 'true',
        type: ExchangeType.DEX,
        skipCcxtPreload: true,
      },
      [ExchangeName.XT]: {
        enabled: this.configService.get('FEATURE_XT', 'true') === 'true',
        type: ExchangeType.CEX,
      },
    });
  }

  get useSandbox(): boolean {
    return this.configService.get('USE_EXCHANGE_SANDBOX', '') === 'true';
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
