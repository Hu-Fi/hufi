import { faker } from '@faker-js/faker';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';
import type { CampaignManifest } from '@/common/types';

export function generateCampaignManifest(): CampaignManifest {
  return {
    exchange: faker.helpers.arrayElement(SUPPORTED_EXCHANGE_NAMES),
    pair: `${faker.finance.currencyCode()}/${faker.finance.currencyCode()}`,
    fund_token: 'HMT',
    start_date: faker.date.recent(),
    end_date: faker.date.future(),
  };
}
