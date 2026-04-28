export type ExtendedBalanceResponse = {
  [asset: string]: {
    balance: string;
    hold_trade: string;
    credit?: string;
    credit_used?: string;
  };
};

export type DepositAddressesResponse = Array<{
  address: string;
  expiretm: string;
  new: boolean;
  tag: string;
}>;

// https://support.kraken.com/articles/360001184886-how-to-interpret-trades-history-fields
export type ReportCsvRow = {
  txid: string;
  time: string;
  pair: string;
  type: 'buy' | 'sell';
  price: string;
  vol: string;
  cost: string;
  ordertype: string;
  misc: string;
};
