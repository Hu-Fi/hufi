import '@/setup-libs';

import logger from '@/logger';
import { BigoneClient } from '@/modules/exchanges/api-client/bigone/bigone-client';

const run = async () => {
  const client = new BigoneClient({
    apiKey: '',
    secret: '',
    userId: 'local-test',
  });

  const SYMBOL = 'USDT';
  const depositAddress = await client.fetchDepositAddress('USDT');
  logger.info('Deposit address', { depositAddress });

  const balance = await client.fetchBalance();
  logger.info('Balance', {
    total: balance.total[SYMBOL],
    free: balance.free[SYMBOL],
    used: balance.used[SYMBOL],
  });

  const since = new Date('2026-02-01T02:00:00.000Z');
  const until = new Date('2026-02-03T15:00:00.000Z');
  const trades = await client.fetchMyTrades(
    'MOB/USDT',
    since.valueOf(),
    until.valueOf(),
  );
  logger.info('Trades', {
    nTrades: trades.length,
    first: trades.at(0),
    last: trades.at(-1),
  });
};

/**
 * yarn ts-node scripts/sample.ts
 */
void (async () => {
  try {
    await run();
    process.exit(0);
  } catch (error) {
    console.log('Failed', error);
    process.exit(1);
  }
})();
