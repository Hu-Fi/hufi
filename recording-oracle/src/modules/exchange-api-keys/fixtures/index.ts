import { faker } from '@faker-js/faker';

import { generateExchangeName } from '~/test/fixtures/manifest';

import { ExchangeApiKeyEntity } from '../exchange-api-key.entity';

export function generateExchangeApiKeysData() {
  return {
    userId: faker.string.uuid(),
    exchangeName: generateExchangeName(),
    apiKey: faker.string.sample(),
    secretKey: faker.string.sample(),
  };
}

export function generateExchangeApiKey(): ExchangeApiKeyEntity {
  const entity = {
    id: faker.string.uuid(),
    ...generateExchangeApiKeysData(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  return entity as ExchangeApiKeyEntity;
}
