import { useCallback, useEffect, useState } from 'react';

import { StakingClient } from '@human-protocol/sdk';

import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useNetwork } from '@/providers/NetworkProvider';
import { formatTokenAmount, getSupportedChainIds } from '@/utils';

import useRetrieveSigner from './useRetrieveSigner';

export const useStake = () => {
  const [stakingClient, setStakingClient] = useState<StakingClient | null>(
    null
  );
  const [isClientInitializing, setIsClientInitializing] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const { activeAddress } = useActiveAccount();
  const { isSwitching, appChainId } = useNetwork();
  const { signer, isCreatingSigner } = useRetrieveSigner();

  const checkSupportedChain = useCallback(() => {
    const isSupportedChain = getSupportedChainIds().includes(appChainId);
    if (!isSupportedChain) {
      setStakingClient(null);
      throw new Error(
        'Unsupported chain. Please switch to a supported network.'
      );
    }
  }, [appChainId]);

  useEffect(() => {
    const initStakingClient = async () => {
      setIsClientInitializing(true);
      if (signer && activeAddress && !isSwitching && !isCreatingSigner) {
        try {
          checkSupportedChain();
          const client = await StakingClient.build(signer);
          setStakingClient(client);
        } catch (error) {
          console.error('Failed to init staking client', error);
          setStakingClient(null);
        } finally {
          setIsClientInitializing(false);
        }
      }
    };

    initStakingClient();
  }, [
    signer,
    activeAddress,
    isSwitching,
    isCreatingSigner,
    checkSupportedChain,
  ]);

  const fetchStakingData = useCallback(async () => {
    checkSupportedChain();
    if (stakingClient && activeAddress) {
      setIsFetching(true);
      try {
        const stakingInfo = await stakingClient.getStakerInfo(activeAddress);
        return formatTokenAmount(Number(stakingInfo?.stakedAmount) || 0);
      } catch (error) {
        console.error('Error fetching staking data', error);
        return null;
      } finally {
        setIsFetching(false);
      }
    }
    return 0;
  }, [stakingClient, activeAddress, checkSupportedChain]);

  return {
    fetchStakingData,
    isClientInitializing,
    isFetching,
  };
};
