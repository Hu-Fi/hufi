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

export type ExchangeData = {
  name: ExchangeName;
  label: string;
  icon?: string;
};
