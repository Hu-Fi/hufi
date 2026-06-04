import dayjs from 'dayjs';

export const BASE_CCXT_CLIENT_OPTIONS = Object.freeze({
  // should be on by default, but just in case
  enableRateLimit: true,
  options: {
    // use spot endpoints for methods
    defaultType: 'spot',
  },
});

export const LOAD_MARKETS_COOLDOWN = dayjs.duration(1, 'hour').asMilliseconds();
