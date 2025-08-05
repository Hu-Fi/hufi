export const SUPPORTED_EXCHANGE_NAMES = [
  'bigone',
  'binance',
  'bitget',
  'bybit',
  'coinbaseexchange',
  'gate',
  'htx',
  'kraken',
  'kucoin',
  'mexc',
  'okx',
  'upbit',
  'xt',
] as const;
export type SupportedExchange = (typeof SUPPORTED_EXCHANGE_NAMES)[number];

export const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

export const DEFAULT_PAGINATION_LIMIT = 10;

export * from './chains';
export * from './escrow';
export * from './token';
