import { useEffect, useState } from 'react';

import { ChainId, NETWORKS, StakerInfo, StakingClient } from '@human-protocol/sdk';
import { ethers } from 'ethers';
import { useChainId } from 'wagmi';

import { ALL_CHAINS } from '../constants';
import { useActiveAccount } from '../providers/ActiveAccountProvider';
import { formatTokenAmount, getSupportedChainIds } from '../utils';

const getRpcUrl = (chainId: ChainId): string => {
  for (const chain of Object.values(ALL_CHAINS)) {
    if (chain.id === chainId) {
      return chain.rpcUrls.default.http[0];
    }
  }
  return '';
};

export const useStake = () => {
  const [stakingData, setStakingData] = useState<StakerInfo | null>(null);
  const [stakingClient, setStakingClient] = useState<StakingClient | null>(null);
  const [isClientInitializing, setIsClientInitializing] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  const { activeAddress } = useActiveAccount();
  const appChainId = useChainId();

  useEffect(() => {
    const initStakingClient = async () => {
      setIsClientInitializing(true);
      try {
        checkSupportedChain();
        const networkData = NETWORKS[appChainId as ChainId];
        if (!networkData) {
          throw new Error(`Unsupported chain ID: ${appChainId}`);
        }
        
        const provider = new ethers.JsonRpcProvider(getRpcUrl(appChainId));
        const client = new StakingClient(provider, networkData);
        setStakingClient(client);
      } catch (error) {
        console.error('Failed to init staking client', error);
        resetData();
      } finally {
        setIsClientInitializing(false);
      }
    };

    activeAddress && appChainId && initStakingClient();
  }, [activeAddress,appChainId]);

  useEffect(() => {
    if (stakingClient && activeAddress) {
      setIsFetchingInfo(true);
      fetchStakingData(stakingClient).finally(() => {
        setIsFetchingInfo(false);
      });
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
    isClientInitializing,
    isFetchingInfo,
    isRefetching,
  };
};
