import { ChainId, NETWORKS } from '@human-protocol/sdk';

import {
  USDT_CONTRACT_ADDRESS,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  LOCALHOST_CHAIN_IDS,
} from '../constants';
import { CHAIN_ICONS } from '../constants/chainIcons';

export const formatAddress = (address?: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-5)}`;
};

export const getTokenAddress = (
  chainId: ChainId,
  name: string
): string | undefined => {
  switch (name) {
    case 'usdt':
      return USDT_CONTRACT_ADDRESS[chainId];
    case 'hmt':
      return NETWORKS[chainId]?.hmtAddress;
  }
};

export const getSupportedChainIds = (): ChainId[] => {
  switch (import.meta.env.VITE_APP_WEB3_ENV) {
    case 'mainnet':
      return MAINNET_CHAIN_IDS;
    case 'testnet':
      return TESTNET_CHAIN_IDS;
    default:
      return LOCALHOST_CHAIN_IDS;
  }
};

export const explorerBaseUrls: Partial<Record<ChainId, string>> = {
  1: 'https://etherscan.io',
  137: 'https://polygonscan.com',
  80002: 'https://amoy.polygonscan.com',
  11155111: 'https://sepolia.etherscan.io',
};

export const getExplorerUrl = (chainId: ChainId, address: string): string => {
  const baseUrl = explorerBaseUrls[chainId];
  
  if (baseUrl) {
    return `${baseUrl}/address/${address}`;
  }

  return `https://polygonscan.com/address/${address}`;
};

export const formatTokenAmount = (amount: string | number, decimals = 18): string | number => {
  const formattedAmount = +amount / Math.pow(10, decimals);
  
  if (formattedAmount >= 1000) {
    return Math.round(formattedAmount);
  } else {
    return parseFloat(formattedAmount.toFixed(3));
  }
};

export const getChainIcon = (id?: ChainId) => {
  if (!id) return null;
  return CHAIN_ICONS[id] || null;
};

export const getNetworkName = (chainId?: ChainId): string | undefined => {
  if (!chainId) return undefined;
  return NETWORKS[chainId]?.title;
};
