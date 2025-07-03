import { faker } from '@faker-js/faker';
import type { Order, Trade } from 'ccxt';

import { generateTradingPair } from './exchange';
import { TakerOrMakerFlag, TradingSide } from '../types';

const TRADING_SIDES = Object.values(TradingSide);
function generateTradingSide(): TradingSide {
  return faker.helpers.arrayElement(TRADING_SIDES);
}

const TAKER_OR_MAKER_FLAGS = Object.values(TakerOrMakerFlag);
function generateTakerOrMakerFlag(): TakerOrMakerFlag {
  return faker.helpers.arrayElement(TAKER_OR_MAKER_FLAGS);
}

export function generateCcxtTrade(overrides: Partial<Trade>): Trade {
  const price = faker.number.float({ min: 0.01, max: 100_000 });
  const amount = faker.number.float({ min: 0.001, max: 1_000 });

  const trade: Trade = {
    /**
     * Id format depends on exchange, so use any id-like string
     */
    id: faker.string.ulid(),
    order: faker.string.ulid(),
    timestamp: faker.date.past().valueOf(),
    symbol: generateTradingPair(),
    side: generateTradingSide(),
    takerOrMaker: generateTakerOrMakerFlag(),
    price,
    amount,
    cost: amount * price,
    // excessive
    info: { response_as_is: faker.string.sample() },
    etc: faker.string.sample(),
  };

  Object.assign(trade, overrides);

  return trade;
}

type OpenOrder = Order & { status: 'open' };
export function generateCcxtOpenOrder(
  overrides: Partial<OpenOrder>,
): OpenOrder {
  const minAmount = 0.001;
  const amount = faker.number.float({ min: minAmount, max: 1_000 });
  const filled = faker.number.float({ min: minAmount, max: amount });
  const price = faker.number.float({ min: 0.01, max: 100_000 });

  const order: OpenOrder = {
    /**
     * Id format depends on exchange, so use any id-like string
     */
    id: faker.string.ulid(),
    status: 'open',
    timestamp: faker.date.past().valueOf(),
    symbol: generateTradingPair(),
    side: generateTradingSide(),
    type: 'limit',
    amount,
    filled,
    cost: filled * price,
    // excessive
    info: { response_as_is: faker.string.sample() },
    trades: [],
    etc: faker.string.sample(),
  };

  Object.assign(order, overrides);

  return order;
}
