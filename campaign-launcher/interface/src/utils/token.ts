import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { ethers } from 'ethers';

import ERC20ABI from '../abi/ERC20.json';
import { USDT_CONTRACT_ADDRESS } from '../constants';

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

export const getTokenDecimals = (
  chainId: ChainId,
  tokenName: string
): Promise<number> => {
  const tokenAddress = getTokenAddress(chainId, tokenName);

  if (!tokenAddress?.length) {
    throw new Error('Fund token is not supported.');
  }

  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI);

  return tokenContract.decimals();
};
