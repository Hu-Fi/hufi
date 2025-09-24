import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAccount } from 'wagmi';

import { Address } from '../types';

type ActiveAccountContextType = {
  activeAddress?: Address;
  setActiveAddress: (address: Address) => void;
  clearActiveAddress: () => void;
};

const ActiveAccountContext = createContext<
  ActiveAccountContextType | undefined
>(undefined);

const PERSISTED_ADDRESS_KEY = 'active-address';

const ActiveAccountProvider: FC<PropsWithChildren> = ({ children }) => {
  const [activeAddress, setActiveAddressState] = useState<Address | undefined>(undefined);
  const { isConnected } = useAccount();

  useEffect(() => {
    const persistedAddress = localStorage.getItem(PERSISTED_ADDRESS_KEY) as
      | Address
      | null;
    if (isConnected && !activeAddress && persistedAddress) {
      setActiveAddressState(persistedAddress);
    }
  }, [isConnected, activeAddress]);

  const setActiveAddress = useCallback((address: Address) => {
    setActiveAddressState(address);
    localStorage.setItem(PERSISTED_ADDRESS_KEY, address);
  }, []);

  const clearActiveAddress = useCallback(() => {
    setActiveAddressState(undefined);
    localStorage.removeItem(PERSISTED_ADDRESS_KEY);
  }, []);

  const value = useMemo(
    () => ({ activeAddress, setActiveAddress, clearActiveAddress }),
    [activeAddress, setActiveAddress, clearActiveAddress]
  );

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
