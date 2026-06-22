import ms from 'ms';

export const BASE_API_URL = 'https://api.kucoin.com';

/**
 * The number in milliseconds before requests time out
 */
export const API_TIMEOUT = ms('10 seconds');

export const MAX_PAGE_SIZE = 100;

export const DEPOSIT_ADDRESS_NETWORK = 'eth';
/**
 * Time in milliseconds that is allowed for historical data lookback.
 *
 * Normally we should not lookback for more than 2 days, but have some
 * reasonable limit in order to get notified about anomalies
 * bacuse API allows 7 days lookback.
 */
export const MAX_LOOKBACK_MS = ms('4 days');

export enum ApiPermissionErrorCode {
  API_KEY_DOES_NOT_EXIST = '400003',
  PASSPHRASE_ERROR = '400004',
  SIGNATURE_ERROR = '400005',
  IP_NOT_IN_WHITELIST = '400006',
  ACCESS_DENIED = '400007',
  USER_IS_FROZEN = '411100',
  NOT_LOGGED_IN = '400401',
  ACCOUNT_TEMPORARILY_RESTRICTED = '400444',
}

export const ApiPermissionErrorCodes = Object.values(ApiPermissionErrorCode);
