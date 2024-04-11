export type TokenName = 'btc' | 'eth' | 'bnb' | 'usdt' | 'usdc';

export type TokenData = {
  name: TokenName;
  label: string;
  icon?: string;
};
