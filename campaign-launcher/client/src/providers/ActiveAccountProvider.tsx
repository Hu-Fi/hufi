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

import { useAccount } from 'wagmi';

import type { EvmAddress } from '@/types';

type ActiveAccountContextType = {
  activeAddress?: EvmAddress;
  setActiveAddress: (address: EvmAddress) => void;
  clearActiveAddress: () => void;
  isConnecting: boolean;
  updateIsConnecting: (value: boolean) => void;
};

const ActiveAccountContext = createContext<
  ActiveAccountContextType | undefined
>(undefined);

const PERSISTED_ADDRESS_KEY = 'active-address';

const ActiveAccountProvider: FC<PropsWithChildren> = ({ children }) => {
  const [activeAddress, setActiveAddressState] = useState<
    EvmAddress | undefined
  >(undefined);
  const [isConnecting, setIsConnecting] = useState(false);
  const { isConnected } = useAccount();

  useEffect(() => {
    const persistedAddress = localStorage.getItem(
      PERSISTED_ADDRESS_KEY
    ) as EvmAddress | null;
    if (isConnected && !activeAddress && persistedAddress) {
      setActiveAddressState(persistedAddress);
    }
  }, [isConnected, activeAddress]);

  const updateIsConnecting = useCallback((value: boolean) => {
    setIsConnecting(value);
  }, []);

  const setActiveAddress = useCallback((address: EvmAddress) => {
    setIsConnecting(false);
    setActiveAddressState(address);
    localStorage.setItem(PERSISTED_ADDRESS_KEY, address);
  }, []);

  const clearActiveAddress = useCallback(() => {
    setActiveAddressState(undefined);
    localStorage.removeItem(PERSISTED_ADDRESS_KEY);
  }, []);

  const value = useMemo(
    () => ({
      activeAddress,
      setActiveAddress,
      clearActiveAddress,
      isConnecting,
      updateIsConnecting,
    }),
    [
      activeAddress,
      setActiveAddress,
      clearActiveAddress,
      isConnecting,
      updateIsConnecting,
    ]
  );

  console.log('isConnecting', isConnecting);

  return (
    <ActiveAccountContext.Provider value={value}>
      {children}
    </ActiveAccountContext.Provider>
  );
};

export const useActiveAccount = (): ActiveAccountContextType => {
  const context = useContext(ActiveAccountContext);
  if (!context) {
    throw new Error(
      'useActiveAccount must be used within ActiveAccountProvider'
    );
  }
  return context;
};

export default ActiveAccountProvider;
