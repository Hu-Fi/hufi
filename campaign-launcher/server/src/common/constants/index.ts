import * as ccxt from 'ccxt';

export const SUPPORTED_EXCHANGE_NAMES = [...ccxt.exchanges] as const;

export const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

export const DEFAULT_PAGINATION_LIMIT = 10;

export * from './chains';
export * from './escrow';
export * from './token';
