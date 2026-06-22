export type ApiKeyInfo = {
  uid: number;
  region: string;
  kycStatus: 0 | 1;
  subName: string;
  remark: string;
  permission: string;
  apiVersion: number;
  createdAt: number;
};

export type ApiDepositAddress = {
  address: string;
  chainId: string;
  chainName: string;
  to: 'MAIN' | 'TRADE';
  expirationDate: number;
  currency: string;
  contractAddress: string;
};

export type ApiAccount = {
  currency: string;
  type: 'main' | 'trade';
  balance: string;
  available: string;
  holds: string;
};

export type ApiSpotTrade = {
  id: number;
  orderId: string;
  counterOrderId: string;
  tradeId: number;
  symbol: string;
  side: 'buy' | 'sell';
  liquidity: 'taker' | 'maker';
  type: 'limit' | 'market';
  price: string;
  size: string;
  funds: string;
  tradeType: string;
  createdAt: number;
};
