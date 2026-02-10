import { faker } from '@faker-js/faker';

import { type ApiTrade } from '../types';

export function generateBigoneTrade(overrides?: Partial<ApiTrade>): ApiTrade {
  const price = faker.number.float({ min: 0.01, max: 100_000 });
  const amount = faker.number.float({ min: 0.001, max: 1_000 });

  const tradeAt = faker.date.past().toISOString();

  const trade: ApiTrade = {
    id: faker.number.int(),
    asset_pair_name: `${faker.finance.currencyCode()}-${faker.finance.currencyCode()}`,
    price: price.toString(),
    amount: amount.toString(),
    taker_side: faker.helpers.arrayElement(['ASK', 'BID']),
    maker_order_id: faker.number.int(),
    taker_order_id: faker.number.int(),
    maker_fee: faker.number.float().toString(),
    taker_fee: faker.number.float().toString(),
    side: faker.helpers.arrayElement(['ASK', 'BID', 'SELF_TRADING']),
    inserted_at: tradeAt,
    created_at: tradeAt,
  };

  Object.assign(trade, overrides);

  return trade;
}
