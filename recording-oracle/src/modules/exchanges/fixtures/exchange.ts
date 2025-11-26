import { faker } from '@faker-js/faker';

import {
  SUPPORTED_EXCHANGE_NAMES,
  SupportedExchange,
} from '@/common/constants';

export function generateExchangeName(): SupportedExchange {
  return faker.helpers.arrayElement(SUPPORTED_EXCHANGE_NAMES);
}

export function generateTradingPair(): string {
  return `${faker.finance.currencyCode()}/${faker.finance.currencyCode()}`;
}
