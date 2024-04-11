export type ExchangeName = 'binance' | 'bitfinex' | 'mexc';

export type ExchangeData = {
  name: ExchangeName;
  label: string;
  icon?: string;
};
