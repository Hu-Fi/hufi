import { faker } from '@faker-js/faker';

import { generateExchangeName } from '@/modules/exchange/fixtures';

import type { CampaignManifest } from '../types';

export function generateTradingPair(): string {
  return `${faker.finance.currencyCode()}/${faker.finance.currencyCode()}`;
}

export function generateCampaignManifest(): CampaignManifest {
  return {
    type: 'MARKET_MAKING',
    daily_volume_target: faker.number.float(),
    exchange: generateExchangeName(),
    pair: generateTradingPair(),
    fund_token: 'HMT',
    start_date: faker.date.recent(),
    end_date: faker.date.future(),
  };
}
