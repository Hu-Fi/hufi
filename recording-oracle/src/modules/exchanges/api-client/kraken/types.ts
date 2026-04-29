export enum ApiKeyPermission {
  QUERY_FUNDS = 'query-funds',
  QUERY_OPEN_TRADES = 'query-open-trades',
  QUERY_CLOSED_TRADES = 'query-closed-trades',
  EXPORT_DATA = 'export-data',
}
export type ApiKeyInfoResponse = {
  api_key_name: string;
  nonce: string;
  nonce_window: string;
  permissions: string[];
};

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
