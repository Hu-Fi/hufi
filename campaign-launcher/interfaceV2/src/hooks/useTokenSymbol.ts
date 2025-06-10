import { useEffect, useState } from 'react';

import { ethers } from 'ethers';

import useClientToSigner from './useClientToSigner';
import ERC20_ABI from '../abi/ERC20.json';

type Props = {
  tokenAddress?: string;
  chainId?: number;
}

export const useTokenSymbol = ({ tokenAddress, chainId }: Props) => {
  const [tokenSymbol, setTokenSymbol] = useState('');
  const { signer } = useClientToSigner();

  useEffect(() => {
    const getTokenInfo = async () => {
      if (!tokenAddress || !chainId || !signer) return;

      try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        const symbol = await contract.symbol();
        setTokenSymbol(symbol);
      } catch (error) {
        console.error('Error getting token symbol:', error);
        setTokenSymbol('HMT');
      }
    };

    getTokenInfo();
  }, [tokenAddress, chainId, signer]);

  return tokenSymbol;
}; 