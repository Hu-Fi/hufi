export const DATABASE_SCHEMA_NAME = 'hu_fi';
// Used for the first user authentication
export const DEFAULT_NONCE = 'signup';
export const JWT_STRATEGY_NAME = 'jwt-http';

export const SUPPORTED_EXCHANGE_NAMES = [
  'bigone',
  'bitmart',
  'bybit',
  'gate',
  'htx',
  'kraken',
  'lbank',
  'mexc',
  'upbit',
  'xt',
] as const;
export type SupportedExchange = (typeof SUPPORTED_EXCHANGE_NAMES)[number];

export const EVM_SIGNATURE_REGEX = /^0x[0-9a-fA-F]{130}$/;

export const DEFAULT_PAGINATION_LIMIT = 10;

export * from './chains';
export * from './token';
