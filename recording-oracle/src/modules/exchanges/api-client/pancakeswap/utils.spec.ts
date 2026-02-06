import { faker } from '@faker-js/faker';
import { ethers } from 'ethers';

import { generateTradingPair } from '../../fixtures';
import { TakerOrMakerFlag, TradingSide } from '../types';
import { generatePancakeswapSwap, generateSubgraphSwapData } from './fixtures';
import { mapSubgraphDataToSwap, mapSwap } from './utils';

describe('BigONE client utils', () => {
  describe('mapSubgraphDataToSwap', () => {
    it('should correctly map data', () => {
      const subgraphSwapData = generateSubgraphSwapData();

      const mapped = mapSubgraphDataToSwap(subgraphSwapData);

      expect(mapped).toEqual({
        id: subgraphSwapData.id,
        hash: subgraphSwapData.hash,
        nonce: subgraphSwapData.nonce,
        timestamp: Number(subgraphSwapData.timestamp),
        amountIn: Number(
          ethers.formatUnits(
            subgraphSwapData.amountIn,
            subgraphSwapData.tokenIn.decimals,
          ),
        ),
        amountOut: Number(
          ethers.formatUnits(
            subgraphSwapData.amountOut,
            subgraphSwapData.tokenOut.decimals,
          ),
        ),
        tokenIn: subgraphSwapData.tokenIn.id,
        tokenOut: subgraphSwapData.tokenOut.id,
      });
    });
  });

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
