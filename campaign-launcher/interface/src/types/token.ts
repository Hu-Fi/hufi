import { Address } from 'viem';

export enum TokenName {
  BTC = 'btc',
  ETH = 'eth',
  BNB = 'bnb',
  USDT = 'usdt',
  USDC = 'usdc',
  HUSD = 'husd',
  XIN = 'xin',
}

export type TokenData = {
  name: TokenName | Address;
  label: string;
  icon?: string;
};
