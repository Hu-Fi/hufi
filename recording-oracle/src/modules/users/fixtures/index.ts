import { faker } from '@faker-js/faker';
import { ethers } from 'ethers';

import * as web3Utils from '@/common/utils/web3';

import { type UserEntity } from '../user.entity';

export function generateUserEntity(
  overrides?: Partial<UserEntity>,
): UserEntity {
  const user: UserEntity = {
    id: faker.string.uuid(),
    evmAddress: ethers.getAddress(faker.finance.ethereumAddress()),
    nonce: web3Utils.generateNonce(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  Object.assign(user, overrides);

  return user;
}
