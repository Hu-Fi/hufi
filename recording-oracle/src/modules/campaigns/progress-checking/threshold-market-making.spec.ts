import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ExchangeApiClient, ExchangesService } from '@/modules/exchanges';
import { generateTrade } from '@/modules/exchanges/fixtures';

import {
  generateThresholdMarketMakingCheckerSetup,
  generateParticipantInfo,
} from './fixtures';
import { ThresholdMarketMakingProgressChecker } from './threshold-market-making';
import { CampaignProgressCheckerSetup, ParticipantInfo } from './types';

const mockedExchangesService = createMock<ExchangesService>();
const mockedExchangeApiClient = createMock<ExchangeApiClient>();

const fetchMyTrades = vi.fn();
async function* fetchMyTradesGenerator() {
  do {
    const result = await fetchMyTrades();

    if (result === undefined || result.length === 0) {
      break;
    } else {
      yield result;
    }
  } while (true);
}

describe('ThresholdMarketMakingProgressChecker', () => {
  beforeEach(() => {
    mockedExchangesService.getClientForUser.mockResolvedValue(
      mockedExchangeApiClient,
    );
    mockedExchangeApiClient.fetchMyTrades.mockImplementation(
      fetchMyTradesGenerator,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('should be defined', () => {
    const resultsChecker = new ThresholdMarketMakingProgressChecker(
      mockedExchangesService,
      generateThresholdMarketMakingCheckerSetup(),
    );
    expect(resultsChecker).toBeDefined();
  });

  test('should fail if no minimum volume target provided', () => {
    expect(() => {
      new ThresholdMarketMakingProgressChecker(mockedExchangesService, {
        ...generateThresholdMarketMakingCheckerSetup(),
        minimumVolumeTarget: undefined,
      });
    }).toThrow('No minimum volume target provided');
  });

  describe('checkForParticipant', () => {
    const minimumVolumeTarget = faker.number.int({ min: 1000, max: 10000 });

    let progressCheckerSetup: CampaignProgressCheckerSetup;
    let participantInfo: ParticipantInfo;

    let resultsChecker: ThresholdMarketMakingProgressChecker;

    beforeEach(() => {
      progressCheckerSetup = generateThresholdMarketMakingCheckerSetup({
        minimumVolumeTarget,
      });
      participantInfo = generateParticipantInfo({
        joinedAt: progressCheckerSetup.periodStart,
      });

      resultsChecker = new ThresholdMarketMakingProgressChecker(
        mockedExchangesService,
        progressCheckerSetup,
      );
    });

    test('should return score=0 when target not reached', async () => {
      const nTrades = faker.number.int({ min: 2, max: 4 });

      const costPerTrade = minimumVolumeTarget / nTrades;
      fetchMyTrades.mockResolvedValueOnce(
        Array.from({ length: nTrades }, () =>
          generateTrade({
            cost: faker.number.float({ min: 0.01, max: costPerTrade - 1 }),
          }),
        ),
      );

      const result = await resultsChecker.checkForParticipant(participantInfo);

      expect(result.abuseDetected).toBe(false);
      expect(result.score).toBe(0);
    });

    test('should return score=1 when target reached', async () => {
      const nTrades = faker.number.int({ min: 2, max: 4 });

      const costPerTrade = minimumVolumeTarget / nTrades;
      fetchMyTrades.mockResolvedValueOnce(
        Array.from({ length: nTrades }, () =>
          generateTrade({
            cost: faker.number.float({
              min: costPerTrade + 1,
              max: costPerTrade + 2,
            }),
          }),
        ),
      );

      const result = await resultsChecker.checkForParticipant(participantInfo);

      expect(result.abuseDetected).toBe(false);
      expect(result.score).toBe(1);
    });
  });

  describe('meta data collection', () => {
    let progressCheckerSetup: CampaignProgressCheckerSetup;

    let resultsChecker: ThresholdMarketMakingProgressChecker;

    beforeEach(() => {
      progressCheckerSetup = generateThresholdMarketMakingCheckerSetup();

      resultsChecker = new ThresholdMarketMakingProgressChecker(
        mockedExchangesService,
        progressCheckerSetup,
      );
    });

    test('should collect correct totals for all checked participants', async () => {
      mockedExchangeApiClient.fetchDepositAddress.mockImplementation(async () =>
        faker.finance.ethereumAddress(),
      );
      const nParticipants = faker.number.int({ min: 2, max: 5 });

      let expectedTotalVolume = 0;
      let expectedTotalScore = 0;
      for (let i = 0; i < nParticipants; i += 1) {
        const trade = generateTrade();
        if (i === 0) {
          trade.cost = 0;
        }
        fetchMyTrades.mockResolvedValueOnce([trade]);
        expectedTotalVolume += trade.cost;
        if (
          trade.cost >= (progressCheckerSetup.minimumVolumeTarget as number)
        ) {
          expectedTotalScore += 1;
        }

        await resultsChecker.checkForParticipant(
          generateParticipantInfo({
            joinedAt: progressCheckerSetup.periodStart,
          }),
        );
      }

      const meta = resultsChecker.getCollectedMeta();
      expect(meta.total_volume).toBe(expectedTotalVolume);
      expect(meta.total_score).toBe(expectedTotalScore);
    });
  });
});
