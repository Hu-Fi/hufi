import { faker } from '@faker-js/faker';

import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchange/fixtures';

import { CampaignProgressCheckerSetup, ParticipantAuthKeys } from '../types';

export function generateParticipantAuthKeys(): ParticipantAuthKeys {
  return {
    apiKey: faker.string.sample(),
    secret: faker.string.sample(),
  };
}

export function generateMarketMakingCheckerSetup(
  overrides?: Partial<CampaignProgressCheckerSetup>,
): CampaignProgressCheckerSetup {
  const input: CampaignProgressCheckerSetup = {
    exchangeName: generateExchangeName(),
    symbol: generateTradingPair(),
    periodStart: faker.date.recent(),
    periodEnd: faker.date.future(),
  };

  Object.assign(input, overrides);

  return input;
}
