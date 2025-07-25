import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';

import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchange/fixtures';
import { generateTestnetChainId } from '@/modules/web3/fixtures';

import { CampaignEntity } from '../campaign.entity';
import type {
  CampaignProgressCheckerSetup,
  ParticipantAuthKeys,
} from '../progress-checking';
import {
  CampaignStatus,
  IntermediateResult,
  IntermediateResultsData,
} from '../types';

export function generateCampaignEntity(): CampaignEntity {
  const startDate = new Date();
  const durationInDays = faker.number.int({ min: 2, max: 7 });

  const campaign = {
    id: faker.string.uuid(),
    chainId: generateTestnetChainId(),
    address: faker.finance.ethereumAddress(),
    pair: generateTradingPair(),
    exchangeName: generateExchangeName(),
    startDate,
    endDate: dayjs(startDate).add(durationInDays, 'days').toDate(),
    status: CampaignStatus.ACTIVE,
    lastResultsAt: null,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  return campaign as CampaignEntity;
}

export function generateProgressCheckerSetup(
  overrides?: Partial<CampaignProgressCheckerSetup>,
): CampaignProgressCheckerSetup {
  const input: CampaignProgressCheckerSetup = {
    exchangeName: generateExchangeName(),
    tradingPair: generateTradingPair(),
    tradingPeriodStart: faker.date.recent(),
    tradingPeriodEnd: faker.date.future(),
  };

  Object.assign(input, overrides);

  return input;
}

export function generateParticipantAuthKeys(): ParticipantAuthKeys {
  return {
    apiKey: faker.string.sample(),
    secret: faker.string.sample(),
  };
}

export function generateIntermediateResult(endDate?: Date): IntermediateResult {
  const to = endDate || faker.date.past();

  return {
    from: dayjs(to).subtract(1, 'day').toISOString(),
    to: to.toISOString(),
    total_volume: faker.number.float(),
    participants_outcomes_batches: [
      {
        id: faker.string.uuid(),
        results: [],
      },
    ],
  };
}

export function generateIntermediateResultsData(
  overrides?: Partial<IntermediateResultsData>,
): IntermediateResultsData {
  const data: IntermediateResultsData = {
    chain_id: generateTestnetChainId(),
    address: faker.finance.ethereumAddress(),
    pair: generateTradingPair(),
    exchange: generateExchangeName(),
    results: [generateIntermediateResult()],
  };

  Object.assign(data, overrides);

  return data;
}
