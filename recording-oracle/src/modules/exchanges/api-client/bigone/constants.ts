import dayjs from 'dayjs';

export const BASE_API_URL = 'https://api.big.one/api/v3/';

export const API_TIMEOUT = dayjs.duration(10, 'seconds').asMilliseconds();

export const DEPOSIT_ADDRESS_NETWORK = 'Ethereum';

export const MAX_LOOKBACK_MS = dayjs.duration(5, 'days').asMilliseconds();

export const N_TRADES_THRESHOLD = 1000;
