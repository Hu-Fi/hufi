import { useEffect, useState } from 'react';

import { ethers } from 'ethers';

import useClientToSigner from './useClientToSigner';
import ERC20_ABI from '../abi/ERC20.json';

type Props = {
  tokenAddress?: string;
  chainId?: number;
}

const useTokenInfo = ({ tokenAddress, chainId }: Props) => {
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(0);
  const { signer } = useClientToSigner();

  useEffect(() => {
    const getTokenInfo = async () => {
      if (!tokenAddress || !chainId || !signer) return;
      
      try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        const [symbol, decimals] = await Promise.all([
          contract.symbol(),
          contract.decimals(),
        ]);
        
        setTokenSymbol(symbol);
        setTokenDecimals(Number(decimals));
      } catch (error) {
        console.error('Error getting token info:', error);
        setTokenSymbol('HMT');
        setTokenDecimals(18);
      }
    };

    getTokenInfo();
  }, [tokenAddress, chainId, signer]);

  return {
    tokenSymbol,
    tokenDecimals,
  };
};

export default useTokenInfo;