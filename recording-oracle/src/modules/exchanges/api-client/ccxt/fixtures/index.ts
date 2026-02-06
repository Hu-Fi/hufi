import { faker } from '@faker-js/faker';
import type {
  Trade,
  AccountBalance as CcxtAccountBalance,
  AddressStructure,
} from 'ccxt';

import { generateTradingSide, generateTakerOrMakerFlag } from '../../fixtures';
import { AccountBalance } from '../../types';

function generateCcxtTradingPair(): string {
  return `${faker.finance.currencyCode()}/${faker.finance.currencyCode()}`;
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
    timestamp: faker.date.recent().valueOf(),
    symbol: generateCcxtTradingPair(),
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

export function generateCcxtBalance(tokens: string[] = []): AccountBalance {
  if (tokens.length === 0) {
    throw new Error('At least one token must be specified');
  }

  const accountBalance: CcxtAccountBalance = {};

  for (const token of tokens) {
    const free = faker.number.float({ max: 42 });
    const used = faker.number.float({ max: 42 });
    accountBalance[token] = {
      free,
      used,
      total: free + used,
    };
  }

  return accountBalance;
}

export function generateCcxtDepositAddressStructure(
  token: string = faker.finance.currencyCode(),
): AddressStructure {
  return {
    currency: token,
    address: faker.finance.ethereumAddress(),
    network: faker.helpers.arrayElement([null, undefined, 'ERC20']),
  };
}
