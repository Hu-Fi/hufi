import { type Trade } from '../api-client';
import {
  generateCcxtTrade,
  generateCcxtBalance,
} from '../api-client/ccxt/fixtures';
import { mapCcxtTrade } from '../api-client/ccxt/utils';

export function generateTrade(overrides?: Partial<Trade>): Trade {
  const trade: Trade = mapCcxtTrade(generateCcxtTrade());

  Object.assign(trade, overrides);

  return trade;
}

export { generateCcxtBalance as generateAccountBalance };
