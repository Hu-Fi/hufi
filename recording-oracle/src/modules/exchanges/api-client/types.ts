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

export enum ExchangePermission {
  FETCH_BALANCE = 'VIEW_ACCOUNT_BALANCE',
  FETCH_DEPOSIT_ADDRESS = 'VIEW_DEPOSIT_ADDRESS',
  FETCH_MY_TRADES = 'VIEW_SPOT_TRADING_HISTORY',
}

export type RequiredAccessCheckResult =
  | {
      success: true;
    }
  | {
      success: false;
      missing: Array<ExchangePermission>;
    };

export type ExtraCreds = { uid: string };

export type BitmartExtras = { apiKeyMemo: string };
export type ExchangeExtras = BitmartExtras;
