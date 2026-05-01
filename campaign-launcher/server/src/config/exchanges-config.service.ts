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
        enabled: this.configService.get('FEATURE_BIGONE', 'true') === 'true',
        ...getExchangeMetaFromCcxt(ExchangeName.BIGONE),
        type: ExchangeType.CEX,
      },
      [ExchangeName.BITMART]: {
        enabled: this.configService.get('FEATURE_BITMART', 'true') === 'true',
        ...getExchangeMetaFromCcxt(ExchangeName.BITMART),
        type: ExchangeType.CEX,
      },
      [ExchangeName.BYBIT]: {
        enabled: this.configService.get('FEATURE_BYBIT', 'true') === 'true',
        ...getExchangeMetaFromCcxt(ExchangeName.BYBIT),
        type: ExchangeType.CEX,
      },
      [ExchangeName.GATE]: {
        enabled: this.configService.get('FEATURE_GATE', 'true') === 'true',
        ...getExchangeMetaFromCcxt(ExchangeName.GATE),
        type: ExchangeType.CEX,
      },
      [ExchangeName.HTX]: {
        enabled: this.configService.get('FEATURE_HTX', 'true') === 'true',
        ...getExchangeMetaFromCcxt(ExchangeName.HTX),
        type: ExchangeType.CEX,
      },
      [ExchangeName.HYPERLIQUID]: {
        enabled:
          this.configService.get('FEATURE_HYPERLIQUID', 'true') === 'true',
        ...getExchangeMetaFromCcxt(ExchangeName.HYPERLIQUID),
        type: ExchangeType.DEX,
      },
      [ExchangeName.KRAKEN]: {
        enabled: this.configService.get('FEATURE_KRAKEN', 'true') === 'true',
        ...getExchangeMetaFromCcxt(ExchangeName.KRAKEN),
        type: ExchangeType.CEX,
      },
      [ExchangeName.MEXC]: {
        enabled: this.configService.get('FEATURE_MEXC', 'true') === 'true',
        ...getExchangeMetaFromCcxt(ExchangeName.MEXC),
        type: ExchangeType.CEX,
      },
      [ExchangeName.PANCAKESWAP]: {
        enabled:
          this.configService.get('FEATURE_PANCAKESWAP', 'true') === 'true',
        displayName: 'PancakeSwap',
        url: 'https://pancakeswap.finance/swap',
        logo: 'https://tokens.pancakeswap.finance/images/symbol/cake.png',
        type: ExchangeType.DEX,
      },
      [ExchangeName.XT]: {
        enabled: this.configService.get('FEATURE_XT', 'true') === 'true',
        ...getExchangeMetaFromCcxt(ExchangeName.XT),
        type: ExchangeType.CEX,
      },
    });
  }

  isExchangeSupported(exchangeName: string): exchangeName is ExchangeName {
    return exchangeName in this.configByExchange;
  }
}
