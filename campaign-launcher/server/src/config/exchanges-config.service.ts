import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ccxt from 'ccxt';

import { ExchangeName, ExchangeType } from '@/common/constants';

type ExchangeConfig = {
  enabled: boolean;
  displayName: string;
  url: string;
  logo: string;
  type: ExchangeType;
};

function getExchangeMetaFromCcxt(
  exchangeName: string,
): Omit<ExchangeConfig, 'enabled' | 'type'> {
  const exchangeClass = ccxt[exchangeName];
  const ccxtClient = new exchangeClass();

  return {
    displayName: ccxtClient.name,
    url: ccxtClient.urls.www,
    logo: ccxtClient.urls.logo,
  };
}

@Injectable()
export class ExchangesConfigService {
  readonly configByExchange: Record<ExchangeName, ExchangeConfig>;

  constructor(private configService: ConfigService) {
    this.configByExchange = Object.freeze({
      [ExchangeName.BIGONE]: {
        enabled: true,
        ...getExchangeMetaFromCcxt(ExchangeName.BIGONE),
        type: ExchangeType.CEX,
      },
      [ExchangeName.BITMART]: {
        enabled: true,
        ...getExchangeMetaFromCcxt(ExchangeName.BITMART),
        type: ExchangeType.CEX,
      },
      [ExchangeName.BYBIT]: {
        enabled: true,
        ...getExchangeMetaFromCcxt(ExchangeName.BYBIT),
        type: ExchangeType.CEX,
      },
      [ExchangeName.GATE]: {
        enabled: true,
        ...getExchangeMetaFromCcxt(ExchangeName.GATE),
        type: ExchangeType.CEX,
      },
      [ExchangeName.HTX]: {
        enabled: true,
        ...getExchangeMetaFromCcxt(ExchangeName.HTX),
        type: ExchangeType.CEX,
      },
      [ExchangeName.HYPERLIQUID]: {
        enabled: this.isHyperliquidEnabled,
        ...getExchangeMetaFromCcxt(ExchangeName.HYPERLIQUID),
        type: ExchangeType.DEX,
      },
      [ExchangeName.KRAKEN]: {
        enabled: true,
        ...getExchangeMetaFromCcxt(ExchangeName.KRAKEN),
        type: ExchangeType.CEX,
      },
      [ExchangeName.MEXC]: {
        enabled: true,
        ...getExchangeMetaFromCcxt(ExchangeName.MEXC),
        type: ExchangeType.CEX,
      },
      [ExchangeName.PANCAKESWAP]: {
        enabled: this.isPancakeswapEnabled,
        displayName: 'PancakeSwap',
        url: 'https://pancakeswap.finance/swap',
        logo: 'https://tokens.pancakeswap.finance/images/symbol/cake.png',
        type: ExchangeType.DEX,
      },
      [ExchangeName.UPBIT]: {
        enabled: true,
        ...getExchangeMetaFromCcxt(ExchangeName.UPBIT),
        type: ExchangeType.CEX,
      },
      [ExchangeName.XT]: {
        enabled: true,
        ...getExchangeMetaFromCcxt(ExchangeName.XT),
        type: ExchangeType.CEX,
      },
    });
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
}
