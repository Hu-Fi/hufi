import { useEffect, useState } from 'react';

import { StakerInfo, StakingClient } from '@human-protocol/sdk';
import { Eip1193Provider, ethers } from 'ethers';
import { useAccount, useChainId, useWalletClient } from 'wagmi';

import { useActiveAccount } from '../providers/ActiveAccountProvider';
import { formatTokenAmount, getSupportedChainIds } from '../utils';

export const useStake = () => {
  const [stakingData, setStakingData] = useState<StakerInfo | null>(null);
  const [stakingClient, setStakingClient] = useState<StakingClient | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const { connector, chainId } = useAccount();
  const { activeAddress } = useActiveAccount();
  const { data: walletClient } = useWalletClient();
  const appChainId = useChainId();

  useEffect(() => {
    const initStakingClient = async () => {
      try {
        if (walletClient && activeAddress && connector) {
          checkSupportedChain();
          const eeip193Provider = await connector?.getProvider();
          const provider = new ethers.BrowserProvider(
            eeip193Provider as Eip1193Provider
          );
          const signer = await provider.getSigner();
          const client = await StakingClient.build(signer);
          setStakingClient(client);
        }
      } catch (error) {
        console.error('Failed to init staking client', error);
        resetData();
      }
    };

    initStakingClient();
  }, [walletClient, activeAddress, chainId, connector, appChainId]);

  useEffect(() => {
    if (stakingClient && activeAddress) {
      fetchStakingData(stakingClient);
    }
  }, [stakingClient, activeAddress]);

  const checkSupportedChain = () => {
    const isSupportedChain = getSupportedChainIds().includes(appChainId);
    if (!isSupportedChain) {
      resetData();
      throw new Error(
        'Unsupported chain. Please switch to a supported network.'
      );
    }
  };

  const resetData = () => {
    setStakingData(null);
    setStakingClient(null);
  };

  const fetchStakingData = async (stakingClient: StakingClient) => {
    checkSupportedChain();
    try {
      const stakingInfo = await stakingClient.getStakerInfo(activeAddress!);
      setStakingData(stakingInfo);
      return stakingInfo;
    } catch (error) {
      console.error('Error fetching staking data', error);
      return null;
    }
  };

  const refetchStakingData = async () => {
    if (stakingClient && activeAddress) {
      setIsRefetching(true);
      const info = await fetchStakingData(stakingClient);
      setIsRefetching(false);
      return formatTokenAmount(Number(info?.stakedAmount) || 0);
    }
    return 0;
  };

  return {
    stakedAmount: formatTokenAmount(Number(stakingData?.stakedAmount) || 0),
    refetchStakingData,
    isRefetching,
  };
};
