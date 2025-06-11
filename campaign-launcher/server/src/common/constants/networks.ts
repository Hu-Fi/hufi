import { ChainId } from '@human-protocol/sdk';

export const TESTNET_CHAIN_IDS = [ChainId.SEPOLIA, ChainId.POLYGON_AMOY];

export const MAINNET_CHAIN_IDS = [ChainId.MAINNET, ChainId.POLYGON];

export const LOCALHOST_CHAIN_IDS = [ChainId.LOCALHOST];

export const TOKENS: Record<string, { symbol: string; decimals: number }> = {
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', decimals: 6 },
  '0xc748b2a084f8efc47e086ccddd9b7e67aeb571bf': { symbol: 'HMT', decimals: 18 },
};
