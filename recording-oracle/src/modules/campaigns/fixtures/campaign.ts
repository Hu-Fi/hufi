import { faker } from '@faker-js/faker';

import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchange/fixtures';
import { generateTestnetChainId } from '@/modules/web3/fixtures';

import { CampaignEntity } from '../campaign.entity';
import { ProgressCheckInput } from '../progress-checkers';
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

export function generateProgressCheckInput(
  overrides?: Partial<ProgressCheckInput>,
): ProgressCheckInput {
  const input: ProgressCheckInput = {
    exchangeName: generateExchangeName(),
    apiClientOptions: {
      apiKey: faker.string.sample(),
      secret: faker.string.sample(),
    },
    pair: generateTradingPair(),
    startDate: faker.date.recent(),
    endDate: faker.date.future(),
  };

  Object.assign(input, overrides);

  return input;
}
