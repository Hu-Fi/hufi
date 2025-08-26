import { faker } from '@faker-js/faker';

import { DevelopmentChainId } from '@/common/constants';
import { Web3ConfigService } from '@/config/web3-config.service';

const testnetChainIds = Object.values(DevelopmentChainId).filter(
  (v) => typeof v === 'number',
);

export function generateTestnetChainId() {
  return faker.helpers.arrayElement(testnetChainIds);
}

export const mockWeb3ConfigService: Omit<Web3ConfigService, 'configService'> = {
  getRpcUrlByChainId: () => faker.internet.url(),
  recordingOracle: faker.finance.ethereumAddress(),
  reputationOracle: faker.finance.ethereumAddress(),
};
