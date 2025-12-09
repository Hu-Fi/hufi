import { faker } from '@faker-js/faker';

type TestDuplciateKeyError = Error & { code: string };
export function createDuplicatedKeyError(): TestDuplciateKeyError {
  const error = new Error(
    `duplicate key value violates unique constraint PK_${faker.string.hexadecimal()}`,
  ) as TestDuplciateKeyError;

  error.code = '23505';

  return error;
}
