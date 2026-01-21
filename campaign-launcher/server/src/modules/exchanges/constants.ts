import { ExchangeName } from '@/common/constants';

export enum ExchangeType {
  CEX = 'cex',
  DEX = 'dex',
}

export type ExchangeMeta = {
  type: ExchangeType;
};

export const ExchangeMeta: Record<ExchangeName, ExchangeMeta> = {
  [ExchangeName.BIGONE]: {
    type: ExchangeType.CEX,
  },
  [ExchangeName.BITMART]: {
    type: ExchangeType.CEX,
  },
  [ExchangeName.BYBIT]: {
    type: ExchangeType.CEX,
  },
  [ExchangeName.GATE]: {
    type: ExchangeType.CEX,
  },
  [ExchangeName.HTX]: {
    type: ExchangeType.CEX,
  },
  [ExchangeName.KRAKEN]: {
    type: ExchangeType.CEX,
  },
  [ExchangeName.MEXC]: {
    type: ExchangeType.CEX,
  },
  [ExchangeName.PANCAKESWAP]: {
    type: ExchangeType.DEX,
  },
  [ExchangeName.UPBIT]: {
    type: ExchangeType.CEX,
  },
  [ExchangeName.XT]: {
    type: ExchangeType.CEX,
  },
};
