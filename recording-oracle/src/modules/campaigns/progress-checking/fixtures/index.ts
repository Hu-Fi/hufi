import { faker } from '@faker-js/faker';
import { vi } from 'vitest';

import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchanges/fixtures';

import { CampaignProgressCheckerSetup, ParticipantInfo } from '../types';

export function generateParticipantInfo(
  overrides: Partial<ParticipantInfo> = {},
): ParticipantInfo {
  const info: ParticipantInfo = {
    id: faker.string.uuid(),
    joinedAt: faker.date.anytime(),
  };

  Object.assign(info, overrides);

  return info;
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

export function generateHoldingCheckerSetup(
  overrides?: Partial<CampaignProgressCheckerSetup>,
): CampaignProgressCheckerSetup {
  const input: CampaignProgressCheckerSetup = {
    exchangeName: generateExchangeName(),
    symbol: faker.finance.currencyCode(),
    periodStart: faker.date.recent(),
    periodEnd: faker.date.future(),
  };

  Object.assign(input, overrides);

  return input;
}

export function generateThresholdCheckerSetup(
  overrides?: Partial<CampaignProgressCheckerSetup>,
): CampaignProgressCheckerSetup {
  const input: CampaignProgressCheckerSetup = {
    exchangeName: generateExchangeName(),
    symbol: faker.finance.currencyCode(),
    periodStart: faker.date.recent(),
    periodEnd: faker.date.future(),
    minimumBalanceTarget: faker.number.float(),
  };

  Object.assign(input, overrides);

  return input;
}

export function generateThresholdMarketMakingCheckerSetup(
  overrides?: Partial<CampaignProgressCheckerSetup>,
): CampaignProgressCheckerSetup {
  const input: CampaignProgressCheckerSetup = {
    exchangeName: generateExchangeName(),
    symbol: generateTradingPair(),
    periodStart: faker.date.recent(),
    periodEnd: faker.date.future(),
    minimumVolumeTarget: faker.number.float({ min: 0.001 }),
  };

  Object.assign(input, overrides);

  return input;
}

export const mockedFetchMyTrades = vi.fn();

export async function* mockedFetchMyTradesGenerator() {
  do {
    const result = await mockedFetchMyTrades();

    if (result === undefined || result.length === 0) {
      break;
    } else {
      yield result;
    }
  } while (true);
}
