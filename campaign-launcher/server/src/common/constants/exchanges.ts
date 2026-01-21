export enum ExchangeName {
  BIGONE = 'bigone',
  BITMART = 'bitmart',
  BYBIT = 'bybit',
  GATE = 'gate',
  HTX = 'htx',
  KRAKEN = 'kraken',
  MEXC = 'mexc',
  PANCAKESWAP = 'pancakeswap',
  UPBIT = 'upbit',
  XT = 'xt',
}

export type SupportedExchange = `${ExchangeName}`;

export const SUPPORTED_EXCHANGE_NAMES: ExchangeName[] = [
  ExchangeName.BIGONE,
  ExchangeName.BITMART,
  ExchangeName.BYBIT,
  ExchangeName.GATE,
  ExchangeName.HTX,
  ExchangeName.KRAKEN,
  ExchangeName.MEXC,
  ExchangeName.UPBIT,
  ExchangeName.XT,
] as const;
