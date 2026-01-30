import { faker } from '@faker-js/faker';
import type { AccountBalance, AddressStructure, Order, Trade } from 'ccxt';

import { ExchangeConfig } from '@/config';
import { generateTradingPair } from '@/modules/exchanges/fixtures';

import { TakerOrMakerFlag, TradingSide } from '../types';

const TRADING_SIDES = Object.values(TradingSide);
function generateTradingSide(): TradingSide {
  return faker.helpers.arrayElement(TRADING_SIDES);
}

const TAKER_OR_MAKER_FLAGS = Object.values(TakerOrMakerFlag);
function generateTakerOrMakerFlag(): TakerOrMakerFlag {
  return faker.helpers.arrayElement(TAKER_OR_MAKER_FLAGS);
}

export function generateCcxtTrade(overrides?: Partial<Trade>): Trade {
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
  overrides?: Partial<OpenOrder>,
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

export function generateAccountBalance(tokens: string[] = []) {
  if (tokens.length === 0) {
    throw new Error('At least one token must be specified');
  }

  const accountBalance: AccountBalance = {
    free: {},
    used: {},
    total: {},
  };

  for (const token of tokens) {
    accountBalance.free[token] = faker.number.float({ max: 42 });
    accountBalance.used[token] = faker.number.float({ max: 42 });
    accountBalance.total[token] =
      accountBalance.free[token] + accountBalance.used[token];
  }

  return accountBalance;
}

export function generateDepositAddressStructure(
  token: string = faker.finance.currencyCode(),
): AddressStructure {
  return {
    currency: token,
    address: faker.finance.ethereumAddress(),
    network: faker.helpers.arrayElement([null, undefined, 'ERC20']),
  };
}

export function generateConfigByExchangeStub(config: ExchangeConfig) {
  return new Proxy(
    {},
    {
      get() {
        return config;
      },
    },
  );
}
