import { Trade } from '../api-client';
import { mapCcxtTrade } from '../api-client/ccxt-exchange-client.utils';
import {
  generateCcxtTrade,
  generateAccountBalance,
} from '../api-client/fixtures';

export function generateTrade(overrides?: Partial<Trade>): Trade {
  const trade: Trade = mapCcxtTrade(generateCcxtTrade());

  Object.assign(trade, overrides);

  return trade;
}

export { generateAccountBalance };
