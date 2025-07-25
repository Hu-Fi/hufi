import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';

import {
  ExchangeApiClient,
  ExchangeApiClientFactory,
  TradingSide,
} from '@/modules/exchange';
import { generateTrade } from '@/modules/exchange/fixtures';

import {
  generateProgressCheckerSetup,
  generateParticipantAuthKeys,
} from '../fixtures';
import { BaseCampaignProgressChecker } from './progress-checker';
import { CampaignProgressCheckerSetup, ParticipantAuthKeys } from './types';

const mockedExchangeApiClient = createMock<ExchangeApiClient>();
const mockedExchangeApiClientFactory = createMock<ExchangeApiClientFactory>();

class TestCampaignProgressChecker extends BaseCampaignProgressChecker {
  override calculateTradeScore = jest.fn();
}

describe('BaseCampaignProgressChecker', () => {
  let progressCheckerSetup: CampaignProgressCheckerSetup;
  let participantAuthKeys: ParticipantAuthKeys;

  let resultsChecker: TestCampaignProgressChecker;

  beforeEach(() => {
    progressCheckerSetup = generateProgressCheckerSetup();
    participantAuthKeys = generateParticipantAuthKeys();

    resultsChecker = new TestCampaignProgressChecker(
      mockedExchangeApiClientFactory as ExchangeApiClientFactory,
      progressCheckerSetup,
    );
  });

  it('should be defined', () => {
    expect(resultsChecker).toBeDefined();
  });

  describe('check', () => {
    beforeEach(() => {
      mockedExchangeApiClientFactory.create.mockReturnValue(
        mockedExchangeApiClient,
      );
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValue([]);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should properly init api client and return zeros for same date range', async () => {
      const anytime = faker.date.anytime();

      const setup = generateProgressCheckerSetup({
        tradingPeriodStart: anytime,
        tradingPeriodEnd: anytime,
      });

      resultsChecker = new TestCampaignProgressChecker(
        mockedExchangeApiClientFactory as ExchangeApiClientFactory,
        setup,
      );

      const result =
        await resultsChecker.checkForParticipant(participantAuthKeys);

      expect(result).toEqual({
        abuseDetected: false,
        totalVolume: 0,
        score: 0,
      });

      expect(mockedExchangeApiClientFactory.create).toHaveBeenCalledTimes(1);
      expect(mockedExchangeApiClientFactory.create).toHaveBeenCalledWith(
        setup.exchangeName,
        participantAuthKeys,
      );
    });

    it('should return zeros when no trades found', async () => {
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([]);

      const result = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
      );

      expect(result).toEqual({
        abuseDetected: false,
        totalVolume: 0,
        score: 0,
      });
    });

    it('should paginate through all trades', async () => {
      const nTradesPerPage = faker.number.int({ min: 2, max: 4 });

      const pages = Array.from({ length: 2 }, () =>
        Array.from({ length: nTradesPerPage }, () => generateTrade()),
      );
      for (const page of pages) {
        mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce(page);
      }

      await resultsChecker.checkForParticipant(participantAuthKeys);

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(3);
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenNthCalledWith(
        1,
        progressCheckerSetup.tradingPair,
        progressCheckerSetup.tradingPeriodStart.valueOf(),
      );
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenNthCalledWith(
        2,
        progressCheckerSetup.tradingPair,
        pages[0].at(-1)!.timestamp + 1,
      );
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenNthCalledWith(
        3,
        progressCheckerSetup.tradingPair,
        pages[1].at(-1)!.timestamp + 1,
      );
    });

    it('should count volume only for buy trades up to exclusive end date', async () => {
      const tradesInRange = Array.from({ length: 3 }, () =>
        generateTrade({
          timestamp: faker.date
            .recent({ refDate: progressCheckerSetup.tradingPeriodEnd })
            .valueOf(),
        }),
      );
      const tradesOutOfRange = [
        generateTrade({
          timestamp: progressCheckerSetup.tradingPeriodEnd.valueOf(),
        }),
        generateTrade({
          timestamp: faker.date
            .soon({ refDate: progressCheckerSetup.tradingPeriodEnd })
            .valueOf(),
        }),
      ];
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([
        ...tradesInRange,
        ...tradesOutOfRange,
      ]);
      const mockedScoreForTrades = 1;
      resultsChecker.calculateTradeScore.mockReturnValue(mockedScoreForTrades);

      const result =
        await resultsChecker.checkForParticipant(participantAuthKeys);

      const expectedTotalVolume = tradesInRange
        .filter((t) => t.side === TradingSide.BUY)
        .reduce((acc, curr) => acc + curr.cost, 0);

      expect(result.abuseDetected).toBe(false);
      expect(result.totalVolume).toBe(expectedTotalVolume);
      expect(result.score).toBe(mockedScoreForTrades * tradesInRange.length);

      expect(resultsChecker.calculateTradeScore).toHaveBeenCalledTimes(
        tradesInRange.length,
      );
      for (const [index, trade] of tradesInRange.entries()) {
        expect(resultsChecker.calculateTradeScore).toHaveBeenNthCalledWith(
          index + 1,
          trade,
        );
      }
    });
  });
});
