#!/usr/bin/env ts-node

import 'tsconfig-paths/register';

import {
  SUPPORTED_EXCHANGE_NAMES,
  SupportedExchange,
} from '@/common/constants';
import { CcxtExchangeClient } from '@/modules/exchanges/api-client/ccxt-exchange-client';
import type { Trade } from '@/modules/exchanges/api-client/types';

type CliOptions = {
  exchange: SupportedExchange;
  apiKey: string;
  secret: string;
  symbol: string;
  since: number;
  sandbox: boolean;
  userId: string;
  uid?: string;
};

function parseArgs(): CliOptions {
  const rawArgs = process.argv.slice(2);
  const args: Record<string, string> = {};

  for (const rawArg of rawArgs) {
    if (!rawArg.startsWith('--')) {
      continue;
    }

    const [name, ...valueParts] = rawArg.slice(2).split('=');
    const value = valueParts.length > 0 ? valueParts.join('=') : 'true';
    args[name] = value;
  }

  const exchange = args.exchange as SupportedExchange;
  if (!exchange || !SUPPORTED_EXCHANGE_NAMES.includes(exchange)) {
    throw new Error(
      `--exchange is required and must be one of: ${SUPPORTED_EXCHANGE_NAMES.join(
        ', ',
      )}`,
    );
  }

  const apiKey =
    (args.apiKey as string | undefined) ?? process.env.EXCHANGE_API_KEY;
  const secret =
    (args.secret as string | undefined) ?? process.env.EXCHANGE_API_SECRET;

  if (!apiKey || !secret) {
    throw new Error(
      'Provide API credentials via --apiKey/--secret or EXCHANGE_API_KEY/EXCHANGE_API_SECRET env vars',
    );
  }

  const symbol = (args.symbol as string | undefined) ?? 'ETH/USDT';
  const sinceInput = args.since as string | undefined;
  const since =
    sinceInput !== undefined
      ? Number(sinceInput)
      : Date.now() - 24 * 60 * 60 * 1000; // default: last 24h

  if (Number.isNaN(since)) {
    throw new Error('--since must be a timestamp in milliseconds');
  }

  const sandbox = String(args.sandbox ?? '').toLowerCase() === 'true';
  const userId = (args.userId as string | undefined) ?? 'manual-script';
  const uid = (args.uid as string | undefined);
  console.log(userId);
  return {
    exchange,
    apiKey,
    secret,
    symbol,
    since,
    sandbox,
    userId,
    uid,
  };
}

async function fetchTrades(options: CliOptions): Promise<Trade[]> {
  const client = new CcxtExchangeClient(options.exchange, {
    apiKey: options.apiKey,
    secret: options.secret,
    userId: options.userId,
    sandbox: options.sandbox,
    uid: options.uid,
  });

  return client.fetchMyTrades(options.symbol, options.since);
}

async function main(): Promise<void> {
  const options = parseArgs();
  const trades = await fetchTrades(options);

  if (trades.length === 0) {
    console.log('No trades returned');
    return;
  }

  console.log(
    JSON.stringify(
      trades.map((trade) => ({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        takerOrMaker: trade.takerOrMaker,
        price: trade.price,
        amount: trade.amount,
        cost: trade.cost,
        timestamp: trade.timestamp,
      })),
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('Failed to fetch trades', error);
  process.exitCode = 1;
});
