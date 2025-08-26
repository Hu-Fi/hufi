import { mapCcxtTrade } from '../ccxt-exchange-client';
import { Trade } from '../types';
import { generateCcxtTrade } from './ccxt';

export function generateTrade(overrides?: Partial<Trade>): Trade {
  const trade: Trade = mapCcxtTrade(generateCcxtTrade());

  Object.assign(trade, overrides);

  return trade;
}
