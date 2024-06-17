import { Address } from 'viem';

export type TokenName = 'btc' | 'eth' | 'bnb' | 'usdt' | 'usdc' | 'husd';

export type TokenData = {
  name: TokenName | Address;
  label: string;
  icon?: string;
};
