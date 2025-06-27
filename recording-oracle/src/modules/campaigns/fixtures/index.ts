import { faker } from '@faker-js/faker';

import { generateTestnetChainId } from '@/modules/web3/fixtures';
import {
  generateExchangeName,
  generateTradingPair,
} from '~/test/fixtures/manifest';

import { CampaignEntity } from '../campaign.entity';
import { CampaignStatus } from '../types';

export function generateCampaignEntity(): CampaignEntity {
  const startDate = faker.date.soon();
  const campaign = {
    id: faker.string.uuid(),
    chainId: generateTestnetChainId(),
    address: faker.finance.ethereumAddress(),
    pair: generateTradingPair(),
    exchangeName: generateExchangeName(),
    startDate: faker.date.soon(),
    endDate: faker.date.soon({ refDate: startDate }),
    status: CampaignStatus.ACTIVE,
    lastResultsAt: null,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  return campaign as CampaignEntity;
}
