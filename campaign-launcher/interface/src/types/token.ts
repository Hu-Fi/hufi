export type TokenName = 'btc' | 'eth' | 'bnb' | 'usdt' | 'usdc' | 'husd';

export type TokenData = {
  name: TokenName;
  label: string;
  icon?: string;
};
