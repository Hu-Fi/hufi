export enum TradingSide {
  SELL = 'sell',
  BUY = 'buy',
}

export enum TakerOrMakerFlag {
  TAKER = 'taker',
  MAKER = 'maker',
}

export type Trade = {
  id: string;
  timestamp: number;
  symbol: string;
  side: `${TradingSide}`;
  takerOrMaker: `${TakerOrMakerFlag}`;
  price: number;
  amount: number;
  cost: number;
};

export type TokenBalance = {
  free: number;
  used: number;
  total: number;
};
export type AccountBalance = Record<string, TokenBalance | undefined>;

export enum ExchangePermission {
  VIEW_ACCOUNT_BALANCE = 'VIEW_ACCOUNT_BALANCE',
  VIEW_DEPOSIT_ADDRESS = 'VIEW_DEPOSIT_ADDRESS',
  VIEW_SPOT_TRADING_HISTORY = 'VIEW_SPOT_TRADING_HISTORY',
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
