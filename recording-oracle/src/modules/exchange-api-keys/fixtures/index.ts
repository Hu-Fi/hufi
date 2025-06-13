import { faker } from '@faker-js/faker';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';

export function generateExchangeApiKeysData() {
  return {
    userId: faker.string.uuid(),
    exchangeName: generateExchangeName(),
    apiKey: faker.string.sample(),
    secretKey: faker.string.sample(),
  };
}

export function generateExchangeName() {
  return faker.helpers.arrayElement(SUPPORTED_EXCHANGE_NAMES);
}
