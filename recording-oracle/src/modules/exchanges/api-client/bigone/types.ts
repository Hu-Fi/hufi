/**
 * https://open.big.one/docs/spot/rest/get-user-trades#responses
 */
export type ApiTrade = {
  id: number; // 5549073591
  asset_pair_name: string; // "MOB-USDT"
  price: string; // "0.249"
  amount: string; // "2498.25"
  taker_side: 'ASK' | 'BID';
  maker_order_id: number | null; // 74066409372
  taker_order_id: number; // 74066409391
  maker_fee: string | null; // "0.37323855"
  taker_fee: string | null; // "1.9986"
  side: 'ASK' | 'BID' | 'SELF_TRADING';
  inserted_at: string; // "2026-01-28T21:50:39.288Z"
  created_at: string; // "2026-01-28T21:50:39.288Z"
};

/**
 * https://open.big.one/docs/wallet/rest/get-deposit-address#responses
 */
export type ApiDepositAddress = {
  id: number; // 6397898
  chain: string; // Ethereum
  value: string; // 0x3deb263dcba28c4ab78933d247ee357f65ec4520
  memo: string;
};

/**
 * https://open.big.one/docs/spot/rest/get-accounts#responses
 */
export type ApiSpotAccountBalance = {
  asset_symbol: string;
  balance: string;
  locked_balance: string;
};
