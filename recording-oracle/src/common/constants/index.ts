import * as ccxt from 'ccxt';

export const DATABASE_SCHEMA_NAME = 'hu_fi';
// Used for the first user authentication
export const DEFAULT_NONCE = 'signup';
export const JWT_STRATEGY_NAME = 'jwt-http';

export const SUPPORTED_EXCHANGE_NAMES = [...ccxt.exchanges] as const;

export const EVM_SIGNATURE_REGEX = /^0x[0-9a-fA-F]{130}$/;

export * from './chains';
