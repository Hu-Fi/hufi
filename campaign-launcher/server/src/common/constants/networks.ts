import { ChainId, NETWORKS } from '@human-protocol/sdk';

export const TESTNET_CHAIN_IDS = [ChainId.SEPOLIA, ChainId.POLYGON_AMOY];

export const MAINNET_CHAIN_IDS = [ChainId.MAINNET, ChainId.POLYGON];

export const LOCALHOST_CHAIN_IDS = [ChainId.LOCALHOST];

const BASE_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f:137': {
    symbol: 'USDT',
    decimals: 6,
  },
};

const NETWORK_TOKENS: Record<string, { symbol: string; decimals: number }> = {};
Object.values(NETWORKS).forEach((network: any) => {
  if (network.hmtAddress && network.chainId) {
    NETWORK_TOKENS[`${network.hmtAddress.toLowerCase()}:${network.chainId}`] = {
      symbol: 'HMT',
      decimals: 18,
    };
  }
});

export const TOKENS: Record<string, { symbol: string; decimals: number }> = {
  ...NETWORK_TOKENS,
  ...BASE_TOKENS,
};
