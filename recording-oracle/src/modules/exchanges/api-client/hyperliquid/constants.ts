import _ from 'lodash';

import { BASE_CCXT_CLIENT_OPTIONS } from '../ccxt';

export const HYPERLIQUID_TRADES_PAGE_LIMIT = 500;

export const BASE_HYPERLIQUID_CLIENT_OPTIONS = Object.freeze(
  _.merge({}, BASE_CCXT_CLIENT_OPTIONS, {
    options: {
      fetchMarkets: {
        types: ['spot'],
      },
    },
  }),
);
