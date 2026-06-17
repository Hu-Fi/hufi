import ms from 'ms';

export const BASE_API_URL = 'https://api.kucoin.com';

/**
 * The number in milliseconds before requests time out
 */
export const API_TIMEOUT = ms('10 seconds');

export const DEPOSIT_ADDRESS_NETWORK = 'eth';
/**
 * Time in milliseconds that is allowed for historical data lookback.
 *
 * Normally we should not lookback for more than 2 days, but have some
 * reasonable limit in order to get notified about anomalies
 * bacuse API allows 7 days lookback.
 */
export const MAX_LOOKBACK_MS = ms('4 days');
