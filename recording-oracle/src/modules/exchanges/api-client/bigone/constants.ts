import ms from 'ms';

export const BASE_API_URL = 'https://api.big.one/api/v3/';

/**
 * The number in milliseconds before requests time out
 */
export const API_TIMEOUT = ms('10 seconds');

export const DEPOSIT_ADDRESS_NETWORK = 'Ethereum';

/**
 * Time in milliseconds that is allowed for historical data lookback
 */
export const MAX_LOOKBACK_MS = ms('5 days');
