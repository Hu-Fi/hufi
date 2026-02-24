import fs from 'fs';

import _ from 'lodash';

import '@/setup-libs';

import logger from '@/logger';
import { type Trade } from '@/modules/exchanges';
import {
  CcxtExchangeClient,
  SEQUENCE_ID_SYMBOL,
} from '@/modules/exchanges/api-client/ccxt';

const API_KEY = '';
const API_SECRET = '';

const EXCHANGE_NAME = 'bybit';

const run = async () => {
  const client = new CcxtExchangeClient(EXCHANGE_NAME, {
    apiKey: API_KEY,
    secret: API_SECRET,
    userId: 'local-test',
  });

  const since = new Date('2026-02-16T13:00:00.000Z');
  const until = new Date('2026-02-17T06:22:09.000Z');

  const allTrades: Trade[] = [];
  let portions = 0;
  let total = 0;
  for await (const trades of client.fetchMyTrades(
    'BTC/USDT',
    since.valueOf(),
    until.valueOf(),
  )) {
    allTrades.push(...trades);
    total += trades.length;
    logger.info(`Trades portion ${++portions}`, {
      nTrades: trades.length,
      total,
    });
  }
  logger.info('Result', {
    nTrades: allTrades.length,
    total,
    first: allTrades.at(0),
    last: allTrades.at(-1),
  });

  const outputTrades = _.orderBy(allTrades, SEQUENCE_ID_SYMBOL, 'desc').map(
    (trade) => ({
      ...trade,
      iso: new Date(trade.timestamp).toISOString(),
    }),
  );
  fs.writeFileSync(
    `${__dirname}/${EXCHANGE_NAME}:${since.valueOf()}-${until.valueOf()}.json`,
    JSON.stringify(outputTrades, null, 2),
  );
};

/**
 * yarn ts-node scripts/trades-pagination-example.ts
 */
void (async () => {
  try {
    await run();
    process.exit(0);
  } catch (error) {
    logger.error('Sample script failed', { error });
    process.exit(1);
  }
})();
