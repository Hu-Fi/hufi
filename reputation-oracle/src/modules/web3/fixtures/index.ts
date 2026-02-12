import { faker } from '@faker-js/faker';

import { DevelopmentChainId } from '@/common/constants';
import { Web3ConfigService } from '@/config/web3-config.service';
import { generateEthWallet } from '~/test/fixtures/web3';

const testWallet = generateEthWallet();

const testnetChainIds = Object.values(DevelopmentChainId).filter(
  (v) => typeof v === 'number',
);

export function generateTestnetChainId() {
  return faker.helpers.arrayElement(testnetChainIds);
}

export const mockWeb3ConfigService: Omit<Web3ConfigService, 'configService'> = {
  privateKey: testWallet.privateKey,
  operatorAddress: testWallet.address,
  gasPriceMultiplier: faker.number.int({ min: 1, max: 42 }),
  getRpcUrlByChainId: () => faker.internet.url(),
  escrowTxTimeout: faker.number.int({ min: 10, max: 50 }),
};
