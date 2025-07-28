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
  override tradeIdsSample = new Set<string>();
  override calculateTradeScore = jest.fn();
}

describe('BaseCampaignProgressChecker', () => {
  beforeEach(() => {
    mockedExchangeApiClientFactory.create.mockReturnValue(
      mockedExchangeApiClient,
    );
    mockedExchangeApiClient.fetchMyTrades.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangeApiClientFactory as ExchangeApiClientFactory,
      generateProgressCheckerSetup(),
    );
    expect(resultsChecker).toBeDefined();
  });

  describe('checkForParticipant', () => {
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

  describe('abuse detection', () => {
    const checkerSetup = generateProgressCheckerSetup();
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangeApiClientFactory as ExchangeApiClientFactory,
      checkerSetup,
    );

    beforeEach(() => {
      resultsChecker.tradeIdsSample.clear();
      /**
       * Always return some positive score in order to
       * make sure it's not counted when abuse detected
       */
      resultsChecker.calculateTradeScore.mockImplementation(() =>
        faker.number.float({ min: 0.1 }),
      );
    });

    it('should return zeros when abuse detected', async () => {
      const sameTrade = generateTrade();
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([
        generateTrade(),
        sameTrade,
        generateTrade({
          /**
           * Override it to 'buy' to always have volume
           */
          side: 'buy',
        }),
        generateTrade({
          /**
           * Last trade is out of configured period,
           * so no more pages fetched for the first participant
           */
          timestamp: checkerSetup.tradingPeriodEnd.valueOf(),
        }),
      ]);
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValue([
        generateTrade({
          /**
           * Override it to buy to make sure it always has some volume
           * but it's not counted if abuse detected
           */
          side: 'buy',
        }),
        sameTrade,
      ]);

      const normalResult = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
      );
      expect(normalResult.abuseDetected).toBe(false);
      expect(normalResult.score).toBeGreaterThan(0);
      expect(normalResult.totalVolume).toBeGreaterThan(0);

      const abuseResult = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
      );
      expect(abuseResult.abuseDetected).toBe(true);
      expect(abuseResult.score).toBe(0);
      expect(abuseResult.totalVolume).toBe(0);
    });

    it('should avoid extra trades fetch if abuse detected', async () => {
      const sameTrade = generateTrade();

      const pages = Array.from({ length: 4 }, () => [
        generateTrade(),
        sameTrade,
      ]);
      for (const page of pages) {
        mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce(page);
      }

      const result = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
      );
      expect(result.abuseDetected).toBe(true);

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(2);
    });

    it('should sample only 5 trades per participant', async () => {
      const trades = Array.from({ length: 6 }, () => generateTrade());
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce(trades);
      await resultsChecker.checkForParticipant(generateParticipantAuthKeys());

      expect(resultsChecker.tradeIdsSample.size).toBe(5);
    });
  });
});
