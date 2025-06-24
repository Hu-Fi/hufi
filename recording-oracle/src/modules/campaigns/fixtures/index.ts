import { faker } from '@faker-js/faker';

import type { CampaignManifest } from '@/common/types';
import { generateExchangeName } from '@/modules/exchange/fixtures';
import { generateTestnetChainId } from '@/modules/web3/fixtures';

import { CampaignEntity } from '../campaign.entity';
import { CampaignStatus } from '../types';

function generateTradingPair(): string {
  return `${faker.finance.currencyCode()}/${faker.finance.currencyCode()}`;
}

export function generateCampaignManifest(): CampaignManifest {
  return {
    exchange: generateExchangeName(),
    pair: generateTradingPair(),
    fund_token: 'HMT',
    start_date: faker.date.recent(),
    end_date: faker.date.future(),
  };
}

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
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  return campaign as CampaignEntity;
}
