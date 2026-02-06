import { faker } from '@faker-js/faker';

import { generateTradingPair } from '../../fixtures';
import { TakerOrMakerFlag, TradingSide } from '../types';
import { generatePancakeswapSwap } from './fixtures';
import { mapSwap } from './utils';

describe('BigONE client utils', () => {
  describe('mapSwap', () => {
    let tradingPair: string;
    let quoteTokenAddress: string;

    beforeEach(() => {
      tradingPair = generateTradingPair();
      quoteTokenAddress = faker.finance.ethereumAddress();
    });

    it('should map to correct format with exact common props', () => {
      const swap = generatePancakeswapSwap();

      const trade = mapSwap(swap, tradingPair, quoteTokenAddress);

      expect(trade).toEqual({
        id: swap.hash,
        timestamp: swap.timestamp * 1000,
        symbol: tradingPair,
        side: expect.any(String),
        takerOrMaker: TakerOrMakerFlag.TAKER,
        amount: expect.any(Number),
        cost: expect.any(Number),
        price: expect.any(Number),
      });
      expect(Object.values(TradingSide)).toContain(trade.side);
      expect(trade.price).toBe(trade.cost / trade.amount);
    });

    it('should correctly map "buy" swap', () => {
      const swap = generatePancakeswapSwap({ tokenIn: quoteTokenAddress });

      const trade = mapSwap(swap, tradingPair, quoteTokenAddress);

      expect(trade.side).toBe(TradingSide.BUY);
      expect(trade.amount).toBe(swap.amountOut);
      expect(trade.cost).toBe(swap.amountIn);
    });

    it('should correctly map "sell" swap', () => {
      const swap = generatePancakeswapSwap({ tokenOut: quoteTokenAddress });

      const trade = mapSwap(swap, tradingPair, quoteTokenAddress);

      expect(trade.side).toBe(TradingSide.SELL);
      expect(trade.amount).toBe(swap.amountIn);
      expect(trade.cost).toBe(swap.amountOut);
    });
  });
});
