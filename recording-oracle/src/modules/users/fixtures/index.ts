import { faker } from '@faker-js/faker';

import * as web3Utils from '@/utils/web3';
import { generateEthWallet } from '~/test/fixtures/web3';

import { UserEntity } from '../user.entity';

type GenerateUserOptions = {
  privateKey?: string;
};

export function generateUserEntity(
  options: GenerateUserOptions = {},
): UserEntity {
  const userWallet = generateEthWallet(options.privateKey);

  const user: UserEntity = {
    id: faker.string.uuid(),
    evmAddress: userWallet.address,
    nonce: web3Utils.generateNonce(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  return user;
}
