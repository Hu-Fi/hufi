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
