import { faker } from '@faker-js/faker';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';
import { CampaignManifest } from '@/common/types';

export function generateTradingPair(): string {
  return `${faker.finance.currencyCode()}/${faker.finance.currencyCode()}`;
}

export function generateExchangeName() {
  return faker.helpers.arrayElement(SUPPORTED_EXCHANGE_NAMES);
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
