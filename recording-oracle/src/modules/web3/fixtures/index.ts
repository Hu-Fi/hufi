import { faker } from '@faker-js/faker';

import { ChainIds } from '@/common/constants';
import { Web3ConfigService } from '@/config/web3-config.service';
import { generateEthWallet } from '~/test/fixtures/web3';

const testWallet = generateEthWallet();

export function generateTestnetChainId() {
  return faker.helpers.arrayElement(ChainIds);
}

export const mockWeb3ConfigService: Omit<Web3ConfigService, 'configService'> = {
  privateKey: testWallet.privateKey,
  operatorAddress: testWallet.address,
  gasPriceMultiplier: faker.number.int({ min: 1, max: 42 }),
  getRpcUrlByChainId: () => faker.internet.url(),
};
