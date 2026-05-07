import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { vi } from 'vitest';

import {
  generateExchangeName,
  generateTradingPair,
} from '@/modules/exchanges/fixtures';
import { generateUserEntity } from '@/modules/users/fixtures';
import { generateTestnetChainId } from '@/modules/web3/fixtures';
import { generateRandomHashString } from '~/test/fixtures/crypto';

import { type CampaignEntity } from '../campaign.entity';
import { type CampaignParticipant } from '../participations';
import type {
  BaseProgressCheckResult,
  CampaignProgressChecker,
  CampaignProgressMeta,
} from '../progress-checking';
import {
  type CampaignDetails,
  type CampaignProgress,
  CampaignStatus,
  CampaignType,
  type IntermediateResult,
  type IntermediateResultsData,
  type ParticipantOutcome,
} from '../types';

export function generateCampaignEntity(type?: CampaignType): CampaignEntity {
  const _type = type || faker.helpers.arrayElement(Object.values(CampaignType));

  let details: CampaignDetails;
  switch (_type) {
    case CampaignType.MARKET_MAKING: {
      details = {
        dailyVolumeTarget: faker.number.float({ min: 1, max: 1000 }),
      };
      break;
    }
    case CampaignType.COMPETITIVE_MARKET_MAKING: {
      const nTopParticipants = faker.number.int({ min: 1, max: 5 });
      const maxRewardSharePerParticipant = Math.floor(100 / nTopParticipants);

      details = {
        minVolumeRequired: faker.number.float({ min: 0.0001, max: 1000 }),
        rewardsDistribution: Array.from({ length: nTopParticipants }, () =>
          faker.number.int({ min: 1, max: maxRewardSharePerParticipant }),
        ),
      };
      break;
    }
    case CampaignType.HOLDING: {
      details = {
        dailyBalanceTarget: faker.number.float({ min: 1, max: 1000 }),
      };
      break;
    }
    case CampaignType.THRESHOLD: {
      details = {
        minimumBalanceTarget: faker.number.float({ min: 1, max: 1000 }),
        maxParticipants: faker.datatype.boolean()
          ? faker.number.int({ min: 1, max: 100 })
          : undefined,
      };
      break;
    }
  }

  /**
   * Campaign duration is [startDate, endDate)
   */
  const startDate = dayjs().subtract(1, 'days').toDate();
  const endDate = dayjs(startDate)
    .add(faker.number.int({ min: 3, max: 7 }), 'days')
    .toDate();

  const campaign: Omit<CampaignEntity, 'beforeInsert' | 'beforeUpdate'> = {
    id: faker.string.uuid(),
    chainId: generateTestnetChainId(),
    address: ethers.getAddress(faker.finance.ethereumAddress()),
    type: _type,
    exchangeName: generateExchangeName(),
    symbol: generateTradingPair(),
    startDate,
    endDate,
    fundAmount: faker.number.float({ min: 10, max: 10000 }).toString(),
    fundToken: faker.finance.currencyCode(),
    fundTokenDecimals: faker.helpers.arrayElement([6, 18]),
    details,
    lastResultsAt: null,
    resultsCutoffAt: null,
    cancellationRequestedAt: null,
    status: CampaignStatus.ACTIVE,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  return campaign as CampaignEntity;
}

export function generateParticipantOutcome(
  campaignType: CampaignType,
  overrides: Partial<ParticipantOutcome> = {},
): ParticipantOutcome {
  const outcome: ParticipantOutcome = {
    address: ethers.getAddress(faker.finance.ethereumAddress()),
    score: faker.number.float(),
  };

  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
    case CampaignType.COMPETITIVE_MARKET_MAKING:
      outcome.total_volume = faker.number.float({ min: 0, max: 10000 });
      break;
    case CampaignType.HOLDING:
    case CampaignType.THRESHOLD:
      outcome.token_balance = faker.number.float({ min: 0, max: 1000 });
      break;
    default:
      throw new Error(
        `Unsupported campaign type for participant outcome: ${campaignType}`,
      );
  }

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
    case CampaignType.COMPETITIVE_MARKET_MAKING:
      meta = {
        total_volume: 0,
      };
      break;
    case CampaignType.HOLDING:
      meta = {
        total_balance: 0,
      };
      break;
    case CampaignType.THRESHOLD:
      meta = {
        total_balance: 0,
        total_score: 0,
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
    reserved_funds: faker.number.float().toString(),
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
export class MockCampaignProgressChecker implements CampaignProgressChecker<
  MockProgressCheckResult,
  {
    [meta: string]: unknown;
  }
> {
  checkForParticipant = vi.fn();
  getCollectedMeta = vi.fn();
}

export function generateCampaignParticipant(
  campaign: CampaignEntity,
): CampaignParticipant {
  return {
    ...generateUserEntity(),
    campaignId: campaign.id,
    joinedAt: faker.date.soon({ refDate: campaign.createdAt }),
  };
}

export function generateUserJoinedDate(campaign: CampaignEntity): string {
  return faker.date
    .between({ from: campaign.startDate, to: campaign.endDate })
    .toISOString();
}
