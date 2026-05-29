import { faker } from '@faker-js/faker';
import { ethers } from 'ethers';
import _ from 'lodash';
import type { PartialDeep } from 'type-fest';

import * as web3Utils from '@/common/utils/web3';

import { DEFAULT_USER_PREFERENCES } from '../constants';
import type { UserPreferencesEntity } from '../user-preferences.entity';
import type { UserEntity } from '../user.entity';

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

export function generateUserPreferences(
  overrides?: PartialDeep<UserPreferencesEntity>,
): UserPreferencesEntity {
  const preferences: UserPreferencesEntity = {
    userId: faker.string.uuid(),
    ...DEFAULT_USER_PREFERENCES,
    telegramUserId: null,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  _.mergeWith(preferences, overrides, (_objVal, srcVal) => {
    if (Array.isArray(srcVal)) {
      return srcVal;
    }
  });

  return preferences;
}
