import { faker } from '@faker-js/faker';

import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchange/fixtures';

import { CampaignType, type CampaignManifest } from '../types';

export function generateCampaignManifest(): CampaignManifest {
  return {
    type: faker.helpers.arrayElement([CampaignType.VOLUME]),
    daily_volume_target: faker.number.float(),
    exchange: generateExchangeName(),
    symbol: generateTradingPair(),
    start_date: faker.date.recent(),
    end_date: faker.date.future(),
  };
}
