export type ExchangeName = 'binance' | 'bitfinex' | 'mexc' | '4swap' | 'exin1';

export type ExchangeData = {
  name: ExchangeName;
  label: string;
  icon?: string;
};
