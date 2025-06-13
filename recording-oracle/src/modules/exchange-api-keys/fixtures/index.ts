import { faker } from '@faker-js/faker';

import { generateExchangeName } from '@/modules/exchange/fixtures';

export function generateExchangeApiKeysData() {
  return {
    userId: faker.string.uuid(),
    exchangeName: generateExchangeName(),
    apiKey: faker.string.sample(),
    secretKey: faker.string.sample(),
  };
}
