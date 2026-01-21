import * as ccxt from 'ccxt';

import { ExchangeName } from '@/common/constants';

export enum ExchangeType {
  CEX = 'cex',
  DEX = 'dex',
}

export type ExchangeMeta = {
  displayName: string;
  url: string;
  logo: string;
  type: ExchangeType;
};

function getExchangeMetaFromCcxt(
  exchangeName: string,
): Omit<ExchangeMeta, 'type'> {
  const exchangeClass = ccxt[exchangeName];
  const ccxtClient = new exchangeClass();

  return {
    displayName: ccxtClient.name,
    url: ccxtClient.urls.www,
    logo: ccxtClient.urls.logo,
  };
}

export const ExchangeMetaMap: Record<ExchangeName, ExchangeMeta> = {
  [ExchangeName.BIGONE]: {
    ...getExchangeMetaFromCcxt(ExchangeName.BIGONE),
    type: ExchangeType.CEX,
  },
  [ExchangeName.BITMART]: {
    ...getExchangeMetaFromCcxt(ExchangeName.BITMART),
    type: ExchangeType.CEX,
  },
  [ExchangeName.BYBIT]: {
    ...getExchangeMetaFromCcxt(ExchangeName.BYBIT),
    type: ExchangeType.CEX,
  },
  [ExchangeName.GATE]: {
    ...getExchangeMetaFromCcxt(ExchangeName.GATE),
    type: ExchangeType.CEX,
  },
  [ExchangeName.HTX]: {
    ...getExchangeMetaFromCcxt(ExchangeName.HTX),
    type: ExchangeType.CEX,
  },
  [ExchangeName.KRAKEN]: {
    ...getExchangeMetaFromCcxt(ExchangeName.KRAKEN),
    type: ExchangeType.CEX,
  },
  [ExchangeName.MEXC]: {
    ...getExchangeMetaFromCcxt(ExchangeName.MEXC),
    type: ExchangeType.CEX,
  },
  [ExchangeName.PANCAKESWAP]: {
    displayName: 'PancakeSwap',
    url: 'https://pancakeswap.finance/swap',
    logo: 'https://tokens.pancakeswap.finance/images/symbol/cake.png',
    type: ExchangeType.DEX,
  },
  [ExchangeName.UPBIT]: {
    ...getExchangeMetaFromCcxt(ExchangeName.UPBIT),
    type: ExchangeType.CEX,
  },
  [ExchangeName.XT]: {
    ...getExchangeMetaFromCcxt(ExchangeName.XT),
    type: ExchangeType.CEX,
  },
} as const;
