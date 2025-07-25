import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';

import {
  ExchangeApiClient,
  ExchangeApiClientFactory,
  TakerOrMakerFlag,
  TradingSide,
} from '@/modules/exchange';
import { generateTrade } from '@/modules/exchange/fixtures';

import { MarketMakingResultsChecker } from './market-making';
import { generateProgressCheckInput } from '../fixtures';

const mockedExchangeApiClient = createMock<ExchangeApiClient>();
const mockedExchangeApiClientFactory = createMock<ExchangeApiClientFactory>();

describe('MarketMakingResultsChecker', () => {
  let resultsChecker: MarketMakingResultsChecker;

  beforeAll(() => {
    resultsChecker = new MarketMakingResultsChecker(
      mockedExchangeApiClientFactory as ExchangeApiClientFactory,
    );
  });

  it('should be defined', () => {
    expect(resultsChecker).toBeDefined();
  });

  describe('calculateTradeScore', () => {
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

      const score = resultsChecker['calculateTradeScore'](trade);

      expect(score).toBe(trade.cost * 0.42);
    });

    it('should return zero score for taker sell', () => {
      const trade = generateTrade({
        takerOrMaker: TakerOrMakerFlag.TAKER,
        side: TradingSide.SELL,
      });

      const score = resultsChecker['calculateTradeScore'](trade);

      expect(score).toBe(0);
    });
  });

  describe('check', () => {
    let spyOnCalculateTradeScore: jest.SpyInstance;

    beforeAll(() => {
      spyOnCalculateTradeScore = jest.spyOn(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resultsChecker as any,
        'calculateTradeScore',
      );
    });

    afterAll(() => {
      spyOnCalculateTradeScore.mockRestore();
    });

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
      const progessCheckInput = generateProgressCheckInput({
        startDate: anytime,
        endDate: anytime,
      });

      const result = await resultsChecker.check(progessCheckInput);

      expect(result).toEqual({
        totalVolume: 0,
        score: 0,
      });

      expect(mockedExchangeApiClientFactory.create).toHaveBeenCalledTimes(1);
      expect(mockedExchangeApiClientFactory.create).toHaveBeenCalledWith(
        progessCheckInput.exchangeName,
        progessCheckInput.apiClientOptions,
      );
    });

    it('should return zeros when no trades found', async () => {
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([]);
      const progessCheckInput = generateProgressCheckInput();

      const result = await resultsChecker.check(progessCheckInput);

      expect(result).toEqual({
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

      const input = generateProgressCheckInput();
      await resultsChecker.check(input);

      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenCalledTimes(3);
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenNthCalledWith(
        1,
        input.pair,
        input.startDate.valueOf(),
      );
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenNthCalledWith(
        2,
        input.pair,
        pages[0].at(-1)!.timestamp + 1,
      );
      expect(mockedExchangeApiClient.fetchMyTrades).toHaveBeenNthCalledWith(
        3,
        input.pair,
        pages[1].at(-1)!.timestamp + 1,
      );
    });

    it('should count volume only for buy trades up to exclusive end date', async () => {
      const input = generateProgressCheckInput();

      const tradesInRange = Array.from({ length: 3 }, () =>
        generateTrade({
          timestamp: faker.date.recent({ refDate: input.endDate }).valueOf(),
        }),
      );
      const tradesOutOfRange = [
        generateTrade({ timestamp: input.endDate.valueOf() }),
        generateTrade({
          timestamp: faker.date.soon({ refDate: input.endDate }).valueOf(),
        }),
      ];
      mockedExchangeApiClient.fetchMyTrades.mockResolvedValueOnce([
        ...tradesInRange,
        ...tradesOutOfRange,
      ]);
      const mockedScoreForTrades = 1;
      spyOnCalculateTradeScore.mockReturnValue(mockedScoreForTrades);

      const result = await resultsChecker.check(input);

      const expectedTotalVolume = tradesInRange
        .filter((t) => t.side === TradingSide.BUY)
        .reduce((acc, curr) => acc + curr.cost, 0);

      expect(result.totalVolume).toBe(expectedTotalVolume);
      expect(result.score).toBe(mockedScoreForTrades * tradesInRange.length);

      expect(spyOnCalculateTradeScore).toHaveBeenCalledTimes(
        tradesInRange.length,
      );
      for (const [index, trade] of tradesInRange.entries()) {
        expect(spyOnCalculateTradeScore).toHaveBeenNthCalledWith(
          index + 1,
          trade,
        );
      }
    });
  });
});
