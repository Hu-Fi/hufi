import { faker } from '@faker-js/faker';

import { type ApiSpotTrade } from '../types';

export function generateKucoinSpotTrade(
  overrides?: Partial<ApiSpotTrade>,
): ApiSpotTrade {
  const price = faker.number.float({ min: 0.01, max: 100_000 });
  const amount = faker.number.float({ min: 0.001, max: 1_000 });

  const trade: ApiSpotTrade = {
    id: faker.number.int(),
    orderId: faker.string.alphanumeric({ length: 24 }),
    counterOrderId: faker.string.alphanumeric({ length: 24 }),
    tradeId: faker.number.int(),
    symbol: `${faker.finance.currencyCode()}-${faker.finance.currencyCode()}`,
    side: faker.helpers.arrayElement(['buy', 'sell']),
    liquidity: faker.helpers.arrayElement(['taker', 'maker']),
    type: faker.helpers.arrayElement(['limit', 'market']),
    price: price.toString(),
    size: amount.toString(),
    funds: (price * amount).toString(),
    tradeType: faker.lorem.word(),
    createdAt: faker.date.past().valueOf(),
  };

  Object.assign(trade, overrides);

  return trade;
}
