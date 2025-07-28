import { faker } from '@faker-js/faker';

import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchange/fixtures';

import { SUPPORTED_CAMPAIGN_TYPES } from '../constants';
import type { CampaignManifest } from '../types';

export function generateCampaignManifest(): CampaignManifest {
  return {
    type: faker.helpers.arrayElement(SUPPORTED_CAMPAIGN_TYPES),
    daily_volume_target: faker.number.float(),
    exchange: generateExchangeName(),
    pair: generateTradingPair(),
    start_date: faker.date.recent(),
    end_date: faker.date.future(),
  };
}
