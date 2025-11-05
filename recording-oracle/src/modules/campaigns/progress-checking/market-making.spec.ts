import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';

import {
  ExchangeApiClient,
  ExchangeApiClientFactory,
  TakerOrMakerFlag,
  Trade,
  TradingSide,
} from '@/modules/exchange';
import { generateTrade } from '@/modules/exchange/fixtures';

import {
  generateMarketMakingCheckerSetup,
  generateParticipantAuthKeys,
} from './fixtures';
import { MarketMakingProgressChecker } from './market-making';
import { CampaignProgressCheckerSetup, ParticipantAuthKeys } from './types';

const mockedExchangeApiClient = createMock<ExchangeApiClient>();
const mockedExchangeApiClientFactory = createMock<ExchangeApiClientFactory>();

class TestCampaignProgressChecker extends MarketMakingProgressChecker {
  override tradeSamples = new Set<string>();

  override calculateTradeScore(trade: Trade): number {
    return super.calculateTradeScore(trade);
  }
}

describe('MarketMakingProgressChecker', () => {
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
      generateMarketMakingCheckerSetup(),
    );
    expect(resultsChecker).toBeDefined();
  });

  describe('calculateTradeScore', () => {
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangeApiClientFactory as ExchangeApiClientFactory,
      generateMarketMakingCheckerSetup(),
    );

    it.each(Object.values(TradingSide))(
      'should return proper score for maker %s',
      (side) => {
        const trade = generateTrade({
          takerOrMaker: TakerOrMakerFlag.MAKER,
          side,
        });

        const score = resultsChecker['calculateTradeScore'](trade);

        expect(score).toBe(trade.cost);
      },
    );

    it('should return proper score for taker buy', () => {
      const trade = generateTrade({
        takerOrMaker: TakerOrMakerFlag.TAKER,
        side: TradingSide.BUY,
      });

      const score = resultsChecker.calculateTradeScore(trade);

      expect(score).toBe(trade.cost * 0.42);
    });

    it('should return proper score for taker sell', () => {
      const trade = generateTrade({
        takerOrMaker: TakerOrMakerFlag.TAKER,
        side: TradingSide.SELL,
      });

      const score = resultsChecker.calculateTradeScore(trade);

      expect(score).toBe(trade.cost * 0.1);
    });
  });

  describe('checkForParticipant', () => {
    let progressCheckerSetup: CampaignProgressCheckerSetup;
    let participantAuthKeys: ParticipantAuthKeys;
    let participantJoinedAt: Date;

    let resultsChecker: TestCampaignProgressChecker;

    beforeEach(() => {
      progressCheckerSetup = generateMarketMakingCheckerSetup();
      participantAuthKeys = generateParticipantAuthKeys();
      participantJoinedAt = progressCheckerSetup.periodStart;

      resultsChecker = new TestCampaignProgressChecker(
        mockedExchangeApiClientFactory as ExchangeApiClientFactory,
        progressCheckerSetup,
      );
    });

    it('should properly init api client and return zeros for same date range', async () => {
      const anytime = faker.date.anytime();

      const setup = generateMarketMakingCheckerSetup({
        periodStart: anytime,
        periodEnd: anytime,
      });

      const resultsChecker = new TestCampaignProgressChecker(
        mockedExchangeApiClientFactory as ExchangeApiClientFactory,
        setup,
      );

      const result = await resultsChecker.checkForParticipant(
        participantAuthKeys,
        anytime,
      );

      expect(result).toEqual({
        abuseDetected: false,
        total_volume: 0,
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
        participantAuthKeys,
        participantJoinedAt,
      );

      expect(result).toEqual({
        abuseDetected: false,
        total_volume: 0,
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

      await resultsChecker.checkForParticipant(
        participantAuthKeys,
        participantJoinedAt,
      );

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(3);
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenNthCalledWith(
        1,
        progressCheckerSetup.symbol,
        progressCheckerSetup.periodStart.valueOf(),
      );
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenNthCalledWith(
        2,
        progressCheckerSetup.symbol,
        pages[0].at(-1)!.timestamp + 1,
      );
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenNthCalledWith(
        3,
        progressCheckerSetup.symbol,
        pages[1].at(-1)!.timestamp + 1,
      );
    });

    it('should paginate through trades starting from join date not setup start', async () => {
      participantJoinedAt = faker.date.between({
        from: progressCheckerSetup.periodStart.valueOf() + 1,
        to: progressCheckerSetup.periodEnd.valueOf() - 1,
      });
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([]);

      await resultsChecker.checkForParticipant(
        participantAuthKeys,
        participantJoinedAt,
      );

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(1);
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledWith(
        progressCheckerSetup.symbol,
        participantJoinedAt.valueOf(),
      );
    });

    it('should count volume for trades up to exclusive end date', async () => {
      const tradesInRange = Array.from({ length: 3 }, () =>
        generateTrade({
          timestamp: faker.date
            .recent({ refDate: progressCheckerSetup.periodEnd })
            .valueOf(),
        }),
      );
      const tradesOutOfRange = [
        generateTrade({
          timestamp: progressCheckerSetup.periodEnd.valueOf(),
        }),
        generateTrade({
          timestamp: faker.date
            .soon({ refDate: progressCheckerSetup.periodEnd })
            .valueOf(),
        }),
      ];
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([
        ...tradesInRange,
        ...tradesOutOfRange,
      ]);

      const result = await resultsChecker.checkForParticipant(
        participantAuthKeys,
        participantJoinedAt,
      );

      const expectedTotalVolume = tradesInRange.reduce(
        (acc, curr) => acc + curr.cost,
        0,
      );
      const expectedScore = tradesInRange.reduce(
        (acc, curr) => acc + resultsChecker.calculateTradeScore(curr),
        0,
      );

      expect(result.abuseDetected).toBe(false);
      expect(result.total_volume).toBe(expectedTotalVolume);
      expect(result.score).toBe(expectedScore);
    });
  });

  describe('abuse detection', () => {
    let spyOnCalculateTradeScore: jest.SpyInstance;

    const progressCheckerSetup = generateMarketMakingCheckerSetup();
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangeApiClientFactory as ExchangeApiClientFactory,
      progressCheckerSetup,
    );

    beforeAll(() => {
      spyOnCalculateTradeScore = jest.spyOn(
        resultsChecker,
        'calculateTradeScore',
      );
    });

    afterAll(() => {
      spyOnCalculateTradeScore.mockRestore();
    });

    beforeEach(() => {
      resultsChecker.tradeSamples.clear();
      /**
       * Always return some positive score in order to
       * make sure it's not counted when abuse detected
       */
      spyOnCalculateTradeScore.mockImplementation(() =>
        faker.number.float({ min: 0.1 }),
      );
    });

    it('should return zeros when abuse detected', async () => {
      const sameTrade = generateTrade();
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([
        generateTrade(),
        sameTrade,
        generateTrade(),
        generateTrade({
          /**
           * Last trade is out of configured period,
           * so no more pages fetched for the first participant
           */
          timestamp: progressCheckerSetup.periodEnd.valueOf(),
        }),
      ]);
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([
        generateTrade(),
        sameTrade,
      ]);

      const normalResult = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
        progressCheckerSetup.periodStart,
      );
      expect(normalResult.abuseDetected).toBe(false);
      expect(normalResult.score).toBeGreaterThan(0);
      expect(normalResult.total_volume).toBeGreaterThan(0);

      const abuseResult = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
        progressCheckerSetup.periodStart,
      );
      expect(abuseResult.abuseDetected).toBe(true);
      expect(abuseResult.score).toBe(0);
      expect(abuseResult.total_volume).toBe(0);
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
        progressCheckerSetup.periodStart,
      );
      expect(result.abuseDetected).toBe(true);

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(2);
    });

    it('should sample only 5 trades per participant', async () => {
      const trades = Array.from({ length: 6 }, () => generateTrade());
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce(trades);
      await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
        progressCheckerSetup.periodStart,
      );

      expect(resultsChecker.tradeSamples.size).toBe(5);
    });

    it('should not detect self-trade as abuse', async () => {
      const baseTrade = generateTrade();
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([
        {
          ...baseTrade,
          side: 'buy',
        },
        {
          ...baseTrade,
          side: 'sell',
        },
      ]);

      const result = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
        progressCheckerSetup.periodStart,
      );

      expect(result.abuseDetected).toBe(false);
      expect(result.score).toBeGreaterThan(0);
      expect(result.total_volume).toBeGreaterThan(0);
    });
  });

  describe('meta data collection', () => {
    let progressCheckerSetup: CampaignProgressCheckerSetup;

    let resultsChecker: TestCampaignProgressChecker;

    beforeEach(() => {
      progressCheckerSetup = generateMarketMakingCheckerSetup();

      resultsChecker = new TestCampaignProgressChecker(
        mockedExchangeApiClientFactory as ExchangeApiClientFactory,
        progressCheckerSetup,
      );
    });

    it('should collect total volume for all checked participants', async () => {
      const nParticipants = faker.number.int({ min: 2, max: 5 });

      let expectedTotalVolume = 0;
      for (let i = 0; i < nParticipants; i += 1) {
        const trade = generateTrade();
        mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([trade]);
        expectedTotalVolume += trade.cost;

        await resultsChecker.checkForParticipant(
          generateParticipantAuthKeys(),
          progressCheckerSetup.periodStart,
        );
      }

      const meta = resultsChecker.getCollectedMeta();
      expect(meta.total_volume).toBe(expectedTotalVolume);
    });

    it('should not count volume of abuse participants', async () => {
      // mock normal trades
      const sameTrade = generateTrade();
      const normalTrades = [
        generateTrade(),
        sameTrade,
        generateTrade(),
        generateTrade({
          /**
           * Last trade is out of configured period,
           * so no more pages fetched for the first participant
           */
          timestamp: progressCheckerSetup.periodEnd.valueOf(),
        }),
      ];
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce(normalTrades);
      // mock abuse trades
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([
        generateTrade(),
        sameTrade,
      ]);

      const normalResult = await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
        progressCheckerSetup.periodStart,
      );
      await resultsChecker.checkForParticipant(
        generateParticipantAuthKeys(),
        progressCheckerSetup.periodStart,
      );

      const meta = resultsChecker.getCollectedMeta();
      expect(meta.total_volume).toBe(normalResult.total_volume);
    });
  });
});
