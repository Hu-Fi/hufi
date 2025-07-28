import { createMock } from '@golevelup/ts-jest';

import {
  ExchangeApiClientFactory,
  TakerOrMakerFlag,
  TradingSide,
} from '@/modules/exchange';
import { generateTrade } from '@/modules/exchange/fixtures';

import { MarketMakingResultsChecker } from './market-making';
import { generateProgressCheckerSetup } from '../fixtures';

const mockedExchangeApiClientFactory = createMock<ExchangeApiClientFactory>();

describe('MarketMakingResultsChecker', () => {
  let resultsChecker: MarketMakingResultsChecker;

  beforeAll(() => {
    resultsChecker = new MarketMakingResultsChecker(
      mockedExchangeApiClientFactory as ExchangeApiClientFactory,
      generateProgressCheckerSetup(),
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
});
