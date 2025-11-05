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
  isConnecting: boolean;
  updateIsConnecting: (isConnecting: boolean) => void;
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

  const { isConnected: isWalletConnected, address: addressInWallet } =
    useAccount();

  const setActiveAddress = useCallback((address: EvmAddress) => {
    setActiveAddressState(address);
    localStorage.setItem(PERSISTED_ADDRESS_KEY, address);
  }, []);

  const clearActiveAddress = useCallback(() => {
    setActiveAddressState(undefined);
    localStorage.removeItem(PERSISTED_ADDRESS_KEY);
  }, []);

  useEffect(() => {
    const persistedAddress = localStorage.getItem(
      PERSISTED_ADDRESS_KEY
    ) as EvmAddress | null;

    if (!isWalletConnected) {
      clearActiveAddress();
      return;
    }
    if (activeAddress) {
      return;
    }
    if (persistedAddress) {
      setActiveAddress(persistedAddress);
      return;
    }
    if (addressInWallet) {
      setActiveAddress(addressInWallet);
      return;
    }
  }, [
    isWalletConnected,
    activeAddress,
    addressInWallet,
    setActiveAddress,
    clearActiveAddress,
  ]);

  const value = useMemo(
    () => ({
      activeAddress,
      isConnecting,
      updateIsConnecting: setIsConnecting,
    }),
    [activeAddress, isConnecting]
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
