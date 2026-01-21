import dayjs from 'dayjs';

export const BASE_CCXT_CLIENT_OPTIONS = Object.freeze({
  // should be on by default, but just in case
  enableRateLimit: true,
  options: {
    /**
     * We don't need it atm, so turn it off to avoid
     * unnecessary api calls that might be done under the hood
     * (e.g. when doing `loadMarkets`)
     */
    fetchCurrencies: false,
    // use spot endpoints for methods
    defaultType: 'spot',
  },
});

export const LOAD_MARKETS_COOLDOWN = dayjs.duration(1, 'hour').asMilliseconds();
