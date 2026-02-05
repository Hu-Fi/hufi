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
      [ExchangeName.KRAKEN]: {
        enabled: true,
        type: ExchangeType.CEX,
      },
      [ExchangeName.MEXC]: {
        enabled: true,
        type: ExchangeType.CEX,
      },
      [ExchangeName.PANCAKESWAP]: {
        enabled: this.isPancakeswapEnabled,
        type: ExchangeType.DEX,
      },
      [ExchangeName.UPBIT]: {
        enabled: true,
        type: ExchangeType.CEX,
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

  isExchangeSupported(exchangeName: string): exchangeName is ExchangeName {
    return exchangeName in this.configByExchange;
  }
}
