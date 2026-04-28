import ms from 'ms';

export const BASE_API_URL = 'https://api.kraken.com';
export const API_KEY_HEADER = 'API-Key';
export const API_SIGNATURE_HEADER = 'API-Sign';

export const REPORT_PROCESSING_TIMEOUT = ms('30 seconds');
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

export const DEPOSIT_METHODS: Record<string, string> = {
  ETH: 'Ether (Hex)',
  USDT: 'Tether USDT (SPL)',
} as const;
