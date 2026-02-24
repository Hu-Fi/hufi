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

import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useNetwork } from '@/providers/NetworkProvider';
import { formatTokenAmount, getSupportedChainIds } from '@/utils';

import { useSignerContext } from './SignerProvider';

type StakeContextType = {
  fetchStakingData: () => Promise<string | null>;
  isFetching: boolean;
  status: ClientStatus;
  isClientPending: boolean;
  isClientReady: boolean;
  isClientMissing: boolean;
};

const StakeContext = createContext<StakeContextType | undefined>(undefined);

enum ClientStatus {
  IDLE = 'idle',
  CREATING = 'creating',
  READY = 'ready',
  ERROR = 'error',
  WAITING_FOR_SIGNER = 'waiting_for_signer',
  UNAVAILABLE = 'unavailable',
}

const StakeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [client, setClient] = useState<StakingClient | null>(null);
  const [status, setStatus] = useState<ClientStatus>(ClientStatus.IDLE);
  const [isFetching, setIsFetching] = useState(false);

  const { activeAddress } = useActiveAccount();
  const { appChainId } = useNetwork();
  const { signer, isSignerMissing } = useSignerContext();

  const checkSupportedChain = useCallback(() => {
    const isSupportedChain = getSupportedChainIds().includes(appChainId);
    if (!isSupportedChain) {
      setClient(null);
      throw new Error(
        'Unsupported chain. Please switch to a supported network.'
      );
    }
  }, [appChainId]);

  useEffect(() => {
    let cancelled = false;

    const initStakingClient = async () => {
      if (isSignerMissing) {
        setStatus(ClientStatus.UNAVAILABLE);
        setClient(null);
        return;
      }

      if (!signer) {
        setStatus(ClientStatus.WAITING_FOR_SIGNER);
        setClient(null);
        return;
      } else {
        setStatus(ClientStatus.CREATING);
        setClient(null);
        try {
          checkSupportedChain();
          const client = await StakingClient.build(signer);
          if (cancelled) return;
          setClient(client);
          setStatus(ClientStatus.READY);
        } catch (error) {
          if (cancelled) return;
          console.error('Failed to init staking client', error);
          setClient(null);
          setStatus(ClientStatus.ERROR);
        }
      }
    };

    initStakingClient();

    return () => {
      cancelled = true;
    };
  }, [signer, isSignerMissing, checkSupportedChain]);

  const fetchStakingData = useCallback(async () => {
    if (client && activeAddress) {
      setIsFetching(true);
      checkSupportedChain();
      try {
        const stakingInfo = await client.getStakerInfo(activeAddress);
        return formatTokenAmount(stakingInfo?.stakedAmount ?? '0n');
      } catch (error) {
        console.error('Error fetching staking data', error);
        throw error;
      } finally {
        setIsFetching(false);
      }
    }

    return null;
  }, [client, activeAddress, checkSupportedChain]);

  const value = useMemo(
    () => ({
      fetchStakingData,
      isFetching,
      status,
      isClientPending:
        status === ClientStatus.IDLE ||
        status === ClientStatus.CREATING ||
        status === ClientStatus.WAITING_FOR_SIGNER,
      isClientReady: status === ClientStatus.READY,
      isClientMissing:
        status === ClientStatus.UNAVAILABLE || status === ClientStatus.ERROR,
    }),
    [fetchStakingData, isFetching, status]
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
