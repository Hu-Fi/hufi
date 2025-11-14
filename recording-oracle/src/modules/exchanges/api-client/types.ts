import type {
  Order as CcxtOrder,
  Trade as CcxtTrade,
  AccountBalance as CcxtAccountBalance,
} from 'ccxt';

export enum TradingSide {
  SELL = 'sell',
  BUY = 'buy',
}

export enum TakerOrMakerFlag {
  TAKER = 'taker',
  MAKER = 'maker',
}

export type Order = Pick<
  CcxtOrder,
  | 'id'
  | 'status'
  | 'timestamp'
  | 'symbol'
  | 'side'
  | 'type'
  | 'amount'
  | 'filled'
  | 'cost'
>;

export type Trade = Pick<
  CcxtTrade,
  | 'id'
  | 'timestamp'
  | 'symbol'
  | 'side'
  | 'takerOrMaker'
  | 'price'
  | 'amount'
  | 'cost'
>;

export type AccountBalance = CcxtAccountBalance;
