import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';

import {
  ExchangeApiClient,
  ExchangesService,
  TakerOrMakerFlag,
  Trade,
  TradingSide,
} from '@/modules/exchanges';
import { generateTrade } from '@/modules/exchanges/fixtures';

import {
  generateMarketMakingCheckerSetup,
  generateParticipantInfo,
} from './fixtures';
import { MarketMakingProgressChecker } from './market-making';
import { CampaignProgressCheckerSetup, ParticipantInfo } from './types';

class TestCampaignProgressChecker extends MarketMakingProgressChecker {
  override tradeSamples = new Set<string>();

  override calculateTradeScore(trade: Trade): number {
    return super.calculateTradeScore(trade);
  }
}

const mockedExchangesService = createMock<ExchangesService>();
const mockedExchangeApiClient = createMock<ExchangeApiClient>();

const fetchMyTrades = jest.fn();
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

describe('MarketMakingProgressChecker', () => {
  beforeEach(() => {
    mockedExchangesService.getClientForUser.mockResolvedValue(
      mockedExchangeApiClient,
    );
    mockedExchangeApiClient.fetchMyTrades.mockImplementation(
      fetchMyTradesGenerator,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangesService,
      generateMarketMakingCheckerSetup(),
    );
    expect(resultsChecker).toBeDefined();
  });

  describe('calculateTradeScore', () => {
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangesService,
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
    let participantInfo: ParticipantInfo;

    let resultsChecker: TestCampaignProgressChecker;

    beforeEach(() => {
      progressCheckerSetup = generateMarketMakingCheckerSetup();
      participantInfo = generateParticipantInfo({
        joinedAt: progressCheckerSetup.periodStart,
      });

      resultsChecker = new TestCampaignProgressChecker(
        mockedExchangesService,
        progressCheckerSetup,
      );
    });

    it('should properly init api client and iterator for trades', async () => {
      const anytime = faker.date.anytime();

      const setup = generateMarketMakingCheckerSetup({
        periodStart: anytime,
        periodEnd: anytime,
      });

      const resultsChecker = new TestCampaignProgressChecker(
        mockedExchangesService,
        setup,
      );

      const result = await resultsChecker.checkForParticipant(participantInfo);

      expect(result).toEqual({
        abuseDetected: false,
        total_volume: 0,
        score: 0,
      });

      expect(mockedExchangesService.getClientForUser).toHaveBeenCalledTimes(1);
      expect(mockedExchangesService.getClientForUser).toHaveBeenCalledWith(
        participantInfo.id,
        setup.exchangeName,
      );

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(1);
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledWith(
        setup.symbol,
        Math.max(
          setup.periodStart.valueOf(),
          participantInfo.joinedAt.valueOf(),
        ),
        setup.periodEnd.valueOf(),
      );
    });

    it('should return zeros when no trades found', async () => {
      fetchMyTrades.mockResolvedValueOnce([]);

      const result = await resultsChecker.checkForParticipant(participantInfo);

      expect(result).toEqual({
        abuseDetected: false,
        total_volume: 0,
        score: 0,
      });
    });

    it('should iterate through all trades', async () => {
      const nTradesPerPage = faker.number.int({ min: 2, max: 4 });

      const pages = Array.from({ length: 2 }, () =>
        Array.from({ length: nTradesPerPage }, () => generateTrade()),
      );
      for (const page of pages) {
        fetchMyTrades.mockResolvedValueOnce(page);
      }

      await resultsChecker.checkForParticipant(participantInfo);

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(1);

      /**
       * Extra call under the hood to check if more trades on next page
       */
      expect(fetchMyTrades).toHaveBeenCalledTimes(pages.length + 1);
    });

    it('should paginate through trades starting from join date not setup start', async () => {
      participantInfo.joinedAt = faker.date.between({
        from: progressCheckerSetup.periodStart.valueOf() + 1,
        to: progressCheckerSetup.periodEnd.valueOf() - 1,
      });
      fetchMyTrades.mockResolvedValueOnce([]);

      await resultsChecker.checkForParticipant(participantInfo);

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(1);
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledWith(
        progressCheckerSetup.symbol,
        participantInfo.joinedAt.valueOf(),
        progressCheckerSetup.periodEnd.valueOf(),
      );
    });
  });

  describe('abuse detection', () => {
    let spyOnCalculateTradeScore: jest.SpyInstance;

    const progressCheckerSetup = generateMarketMakingCheckerSetup();
    const resultsChecker = new TestCampaignProgressChecker(
      mockedExchangesService,
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
      fetchMyTrades.mockResolvedValueOnce([
        generateTrade(),
        sameTrade,
        generateTrade(),
      ]);
      fetchMyTrades.mockResolvedValueOnce([]); // no more trades for this participant

      fetchMyTrades.mockResolvedValueOnce([generateTrade(), sameTrade]);

      const normalResult = await resultsChecker.checkForParticipant(
        generateParticipantInfo({
          joinedAt: progressCheckerSetup.periodStart,
        }),
      );
      expect(normalResult.abuseDetected).toBe(false);
      expect(normalResult.score).toBeGreaterThan(0);
      expect(normalResult.total_volume).toBeGreaterThan(0);

      const abuseResult = await resultsChecker.checkForParticipant(
        generateParticipantInfo({
          joinedAt: progressCheckerSetup.periodStart,
        }),
      );
      expect(abuseResult.abuseDetected).toBe(true);
      expect(abuseResult.score).toBe(0);
      expect(abuseResult.total_volume).toBe(0);
    });

    it('should avoid extra fetch iterations if abuse detected', async () => {
      const sameTrade = generateTrade();

      const pages = Array.from({ length: 3 }, () => [
        generateTrade(),
        sameTrade,
      ]);
      for (const page of pages) {
        fetchMyTrades.mockResolvedValueOnce(page);
      }

      const result = await resultsChecker.checkForParticipant(
        generateParticipantInfo({
          joinedAt: progressCheckerSetup.periodStart,
        }),
      );
      expect(result.abuseDetected).toBe(true);

      expect(fetchMyTrades).toHaveBeenCalledTimes(2);
    });

    it('should sample only 5 trades per participant', async () => {
      const trades = Array.from({ length: 6 }, () => generateTrade());
      fetchMyTrades.mockResolvedValueOnce(trades);
      await resultsChecker.checkForParticipant(
        generateParticipantInfo({
          joinedAt: progressCheckerSetup.periodStart,
        }),
      );

      expect(resultsChecker.tradeSamples.size).toBe(5);
    });

    it('should not detect self-trade as abuse', async () => {
      const baseTrade = generateTrade();
      fetchMyTrades.mockResolvedValueOnce([
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
        generateParticipantInfo({
          joinedAt: progressCheckerSetup.periodStart,
        }),
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
        mockedExchangesService,
        progressCheckerSetup,
      );
    });

    it('should collect total volume for all checked participants', async () => {
      const nParticipants = faker.number.int({ min: 2, max: 5 });

      let expectedTotalVolume = 0;
      for (let i = 0; i < nParticipants; i += 1) {
        const trade = generateTrade();
        fetchMyTrades.mockResolvedValueOnce([trade]);
        expectedTotalVolume += trade.cost;

        await resultsChecker.checkForParticipant(
          generateParticipantInfo({
            joinedAt: progressCheckerSetup.periodStart,
          }),
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
      fetchMyTrades.mockResolvedValueOnce(normalTrades);
      // mock abuse trades
      fetchMyTrades.mockResolvedValueOnce([generateTrade(), sameTrade]);

      const normalResult = await resultsChecker.checkForParticipant(
        generateParticipantInfo({
          joinedAt: progressCheckerSetup.periodStart,
        }),
      );
      await resultsChecker.checkForParticipant(
        generateParticipantInfo({
          joinedAt: progressCheckerSetup.periodStart,
        }),
      );

      const meta = resultsChecker.getCollectedMeta();
      expect(meta.total_volume).toBe(normalResult.total_volume);
    });
  });
});
