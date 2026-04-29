import ms from 'ms';

export const BASE_API_URL = 'https://api.kraken.com';
export const API_KEY_HEADER = 'API-Key';
export const API_SIGNATURE_HEADER = 'API-Sign';

export const REPORT_POLLING_INTERVAL = ms('3 seconds');
export const REPORT_POLLING_TIMEOUT = ms('30 seconds');
export const API_TIMEOUT = ms('5 seconds');

export enum ApiPermissionErrorCode {
  INVALID_API_KEY = 'EAPI:Invalid key',
  INVALID_SIGNATURE = 'EAPI:Invalid signature',
  INVALID_NONCE = 'EAPI:Invalid nonce',
  PERMISSION_DENIED = 'EGeneral:Permission denied',
  INVALID_PERMISSION = 'EAccount:Invalid permissions',
  ACCOUNT_DISABLED = 'EAuth:Account temporary disabled',
  ACCOUNT_UNCONFIRMED = 'EAuth:Account unconfirmed',
}

export const ApiPermissionErrorCodes = Object.values(ApiPermissionErrorCode);

export const ApiErrorCode = {
  ...ApiPermissionErrorCode,
  REPORT_NOT_READY: 'EExport:Not ready',
} as const;

/**
 * On how to get a full list of valid methods if something changes:
 * https://docs.kraken.com/api/docs/rest-api/get-deposit-methods
 */
export const DEPOSIT_METHODS: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ether (Hex)',
  USDT: 'Tether USD (SPL)',
  USDC: 'USDC (SPL)',
  POL: 'POL - Polygon (Unified)',
} as const;

export const PARSED_TRADES_BATCH_SIZE = 100;
