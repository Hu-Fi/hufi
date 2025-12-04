import { faker } from '@faker-js/faker';

import { generateExchangeName } from '@/modules/exchanges/fixtures';

import { ExchangeApiKeyEntity } from '../exchange-api-key.entity';

export function generateExchangeApiKeysData() {
  return {
    userId: faker.string.uuid(),
    exchangeName: generateExchangeName(),
    apiKey: faker.string.sample(),
    secretKey: faker.string.sample(),
    /**
     * Always have random extras to make sure it used as is where needed in tests.
     * Set it "any" to avoid type errors when passed to generate mocked entities.
     */
    extras: {
      [faker.string.alpha()]: faker.string.sample(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
}

export function generateExchangeApiKey(
  input: {
    encryptedApiKey: string;
    encryptedSecretKey: string;
  },
  overrides: Partial<
    Pick<ExchangeApiKeyEntity, 'userId' | 'exchangeName' | 'extras'>
  > = {},
): ExchangeApiKeyEntity {
  const entity: Omit<ExchangeApiKeyEntity, 'beforeInsert' | 'beforeUpdate'> = {
    id: faker.string.uuid(),
    userId: overrides.userId || faker.string.uuid(),
    exchangeName: overrides.exchangeName || generateExchangeName(),
    apiKey: input.encryptedApiKey,
    secretKey: input.encryptedSecretKey,
    extras: overrides.extras ?? null,
    isValid: true,
    missingPermissions: [],
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  return entity as ExchangeApiKeyEntity;
}
