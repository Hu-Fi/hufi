import { ChainId, NETWORKS } from '@human-protocol/sdk';

import { USDT_CONTRACT_ADDRESS } from '../constants';

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
