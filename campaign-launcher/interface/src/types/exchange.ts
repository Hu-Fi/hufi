export enum ExchangeName {
  Binance = 'binance',
  Bitfinex = 'bitfinex',
  MEXC = 'mexc',
  FourSwap = '4swap',
  ExinOne = 'exin1',
  Uniswap = 'uniswap',
  BigOne = 'bigone',
  LBank = 'lbank',
}

export enum ExchangeType {
  CEX = 'cex',
  DEX = 'dex',
}

export type ExchangeData = {
  name: ExchangeName;
  label: string;
  type: ExchangeType;
  icon?: string;
};
