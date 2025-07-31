import { useEffect, useState } from 'react';

import { ChainId, StakerInfo, StakingClient } from '@human-protocol/sdk';
import { Eip1193Provider, ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';

import { formatTokenAmount, getSupportedChainIds } from '../utils';

export const useStake = () => {
  const [stakingData, setStakingData] = useState<StakerInfo | null>(null);
  const { address, chainId, connector } = useAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    const initStakingClient = async () => {
      try {
        if (walletClient && address && connector) {
          checkSupportedChain();
          const eeip193Provider = await connector?.getProvider();
          const provider = new ethers.BrowserProvider(
            eeip193Provider as Eip1193Provider
          );
          const signer = await provider.getSigner();
          const client = await StakingClient.build(signer);
          await fetchStakingData(client);
        }
      } catch (error) {
        console.error(error);
        resetData();
      }
    };

    initStakingClient();
  }, [walletClient, address, chainId, connector]);

  const checkSupportedChain = () => {
    const isSupportedChain = getSupportedChainIds().includes(chainId as ChainId);
    if (!isSupportedChain) {
      resetData();
      throw new Error(
        'Unsupported chain. Please switch to a supported network.'
      );
    }
  };

  const resetData = () => {
    setStakingData(null);
  };

  const fetchStakingData = async (stakingClient: StakingClient) => {
    checkSupportedChain();
    try {
      const stakingInfo = await stakingClient.getStakerInfo(address!);
      setStakingData(stakingInfo);
    } catch (error) {
      console.error('Error fetching staking data');
    }
  };

  return {
    stakedAmount: stakingData?.stakedAmount
      ? formatTokenAmount(Number(stakingData?.stakedAmount))
      : 0,
  };
};
