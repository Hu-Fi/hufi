import { faker } from '@faker-js/faker';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';

export function generateExchangeName() {
  return faker.helpers.arrayElement(SUPPORTED_EXCHANGE_NAMES);
}

export function generateTradingPair(): string {
  return `${faker.finance.currencyCode()}/${faker.finance.currencyCode()}`;
}
