import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import { ethers } from 'ethers';

import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchange/fixtures';
import type { UserEntity } from '@/modules/users';
import { generateUserEntity } from '@/modules/users/fixtures';
import { generateTestnetChainId } from '@/modules/web3/fixtures';
import { generateRandomHashString } from '~/test/fixtures/crypto';

import { CampaignEntity } from '../campaign.entity';
import type {
  BaseProgressCheckResult,
  CampaignProgressChecker,
  CampaignProgressMeta,
} from '../progress-checking';
import {
  CampaignDetails,
  CampaignProgress,
  CampaignStatus,
  CampaignType,
  IntermediateResult,
  IntermediateResultsData,
  ParticipantOutcome,
} from '../types';

export function generateCampaignEntity(type?: CampaignType): CampaignEntity {
  const _type = type || faker.helpers.arrayElement(Object.values(CampaignType));

  const startDate = dayjs().subtract(1, 'days').toDate();
  const durationInDays = faker.number.int({ min: 3, max: 7 });

  let details: CampaignDetails;
  switch (_type) {
    case CampaignType.MARKET_MAKING:
      details = {
        dailyVolumeTarget: faker.number.float({ min: 1, max: 1000 }),
      };
      break;
    case CampaignType.HOLDING:
      details = {
        dailyBalanceTarget: faker.number.float({ min: 1, max: 1000 }),
      };
      break;
  }

  const campaign: Omit<CampaignEntity, 'beforeInsert' | 'beforeUpdate'> = {
    id: faker.string.uuid(),
    chainId: generateTestnetChainId(),
    address: ethers.getAddress(faker.finance.ethereumAddress()),
    type: _type,
    exchangeName: generateExchangeName(),
    symbol: generateTradingPair(),
    startDate,
    endDate: dayjs(startDate).add(durationInDays, 'days').toDate(),
    fundAmount: faker.number.float({ min: 10, max: 10000 }).toString(),
    fundToken: faker.finance.currencyCode(),
    fundTokenDecimals: faker.helpers.arrayElement([6, 18]),
    details,
    lastResultsAt: null,
    status: CampaignStatus.ACTIVE,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  return campaign as CampaignEntity;
}

export function generateParticipantOutcome(
  overrides: Partial<ParticipantOutcome> = {},
): ParticipantOutcome {
  const outcome: ParticipantOutcome = {
    address: ethers.getAddress(faker.finance.ethereumAddress()),
    score: faker.number.float(),
  };

  Object.assign(outcome, overrides);

  return outcome;
}

export function generateCampaignProgress(
  campaign: CampaignEntity,
): CampaignProgress<CampaignProgressMeta> {
  const from = new Date(campaign.startDate);
  const oneDayFromStart = dayjs(from).add(1, 'day').toDate();
  const to =
    oneDayFromStart > campaign.endDate
      ? new Date(campaign.endDate)
      : oneDayFromStart;

  let meta: CampaignProgressMeta;
  switch (campaign.type) {
    case CampaignType.MARKET_MAKING:
      meta = {
        total_volume: 0,
      };
      break;
    case CampaignType.HOLDING:
      meta = {
        total_balance: 0,
      };
      break;
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    meta,
    participants_outcomes: [],
  };
}

export function generateIntermediateResult({
  endDate,
  meta,
}: {
  endDate?: Date;
  meta?: Record<string, unknown>;
} = {}): IntermediateResult {
  const to = endDate || faker.date.past();

  const intermediateResult = {
    from: dayjs(to).subtract(1, 'day').toISOString(),
    to: to.toISOString(),
    reserved_funds: faker.number.float(),
    participants_outcomes_batches: [],
  };

  Object.assign(intermediateResult, meta);

  return intermediateResult;
}

export function generateIntermediateResultsData(
  overrides?: Partial<IntermediateResultsData>,
): IntermediateResultsData {
  const data: IntermediateResultsData = {
    chain_id: generateTestnetChainId(),
    address: faker.finance.ethereumAddress(),
    symbol: generateTradingPair(),
    exchange: generateExchangeName(),
    results: [generateIntermediateResult()],
  };

  Object.assign(data, overrides);

  return data;
}

export function generateStoredResultsMeta(): { url: string; hash: string } {
  return {
    url: faker.internet.url(),
    hash: generateRandomHashString('sha256'),
  };
}

export type MockProgressCheckResult = BaseProgressCheckResult & {
  [meta: string]: unknown;
};
export class MockCampaignProgressChecker
  implements
    CampaignProgressChecker<
      MockProgressCheckResult,
      {
        [meta: string]: unknown;
      }
    >
{
  checkForParticipant = jest.fn();
  getCollectedMeta = jest.fn();
}

export function generateCampaignParticipant(
  campaign: CampaignEntity,
): UserEntity & { joinedAt: Date } {
  return {
    ...generateUserEntity(),
    joinedAt: faker.date.soon({ refDate: campaign.createdAt }),
  };
}
