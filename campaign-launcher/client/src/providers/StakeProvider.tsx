import {
  type FC,
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { StakingClient } from '@human-protocol/sdk';

import useRetrieveSigner from '@/hooks/useRetrieveSigner';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useNetwork } from '@/providers/NetworkProvider';
import { formatTokenAmount, getSupportedChainIds } from '@/utils';

type StakeContextType = {
  fetchStakingData: () => Promise<string | number | null>;
  isFetching: boolean;
  isClientInitializing: boolean;
  isStakingClientReady: boolean;
};

const StakeContext = createContext<StakeContextType | undefined>(undefined);

const StakeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [stakingClient, setStakingClient] = useState<StakingClient | null>(
    null
  );
  const [isClientInitializing, setIsClientInitializing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

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
      if (signer && !isSwitching && !isCreatingSigner) {
        setIsClientInitializing(true);
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
  }, [signer, isSwitching, isCreatingSigner, checkSupportedChain]);

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

  const value = useMemo(
    () => ({
      fetchStakingData,
      isFetching,
      isClientInitializing,
      isStakingClientReady: !!stakingClient,
    }),
    [fetchStakingData, isFetching, isClientInitializing, stakingClient]
  );

  return (
    <StakeContext.Provider value={value}>{children}</StakeContext.Provider>
  );
};

export const useStakeContext = () => {
  const context = useContext(StakeContext);
  if (!context) {
    throw new Error('useStakeContext must be used within a StakeProvider');
  }
  return context;
};

export default StakeProvider;
