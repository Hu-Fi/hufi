import { mapCcxtTrade } from '../api-client/ccxt-exchange-client';
import {
  generateCcxtTrade,
  generateAccountBalance,
} from '../api-client/fixtures';
import { Trade } from '../api-client/types';

export function generateTrade(overrides?: Partial<Trade>): Trade {
  const trade: Trade = mapCcxtTrade(generateCcxtTrade());

  Object.assign(trade, overrides);

  return trade;
}

export { generateAccountBalance };
