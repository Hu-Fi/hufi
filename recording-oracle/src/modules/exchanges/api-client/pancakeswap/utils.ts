import { ClientError } from 'graphql-request';

import { TakerOrMakerFlag, TradingSide, type Trade } from '../types';
import { Swap } from './types';

export function mapSwap(
  swap: Swap,
  symbol: string,
  quoteTokenAddress: string,
): Trade {
  const mapped: Trade = {
    id: swap.hash,
    timestamp: swap.timestamp * 1000,
    symbol,
    side:
      swap.tokenIn.toLowerCase() === quoteTokenAddress.toLowerCase()
        ? TradingSide.BUY
        : TradingSide.SELL,
    takerOrMaker: TakerOrMakerFlag.TAKER,
    amount: -1,
    cost: -1,
    price: -1,
  };

  if (mapped.side === TradingSide.BUY) {
    mapped.amount = swap.amountOut;
    mapped.cost = swap.amountIn;
  } else {
    mapped.amount = swap.amountIn;
    mapped.cost = swap.amountOut;
  }

  mapped.price = mapped.cost / mapped.amount;

  return mapped;
}

export function formatGraphqlRequestError(error: Error) {
  const formattedError: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  if (error instanceof ClientError) {
    formattedError.stack = 'omit';
    formattedError.message = 'Graph client error';
    formattedError.response = error.response;
  }

  return formattedError;
}
