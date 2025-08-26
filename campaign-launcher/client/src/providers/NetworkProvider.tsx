import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { ChainId } from '@human-protocol/sdk';
import { useConfig, useSwitchChain } from 'wagmi';

type NetworkProviderContextType = {
  appChainId: ChainId;
  setAppChainId: (chainId: ChainId) => void;
  isSwitching: boolean;
};

const NetworkProviderContext = createContext<
  NetworkProviderContextType | undefined
>(undefined);

export const NetworkProvider: FC<PropsWithChildren> = ({ children }) => {
  const config = useConfig();
  const [appChainId, setAppChainId] = useState<ChainId>(config.chains[0].id);
  const [isSwitching, setIsSwitching] = useState(false);
  const { switchChainAsync } = useSwitchChain();

  const handleSwitchChain = useCallback(
    async (chainId: ChainId) => {
      if (appChainId === chainId) return;

      setIsSwitching(true);
      try {
        config.setState((state) => ({
          ...state,
          chainId,
        }));
        setAppChainId(chainId);
        await switchChainAsync?.({ chainId });
      } catch (error) {
        console.error('Failed to switch chain', error);
      } finally {
        setIsSwitching(false);
      }
    },
    [config, switchChainAsync, appChainId]
  );

  const value = useMemo(
    () => ({
      appChainId,
      setAppChainId: handleSwitchChain,
      isSwitching,
    }),
    [appChainId, handleSwitchChain, isSwitching]
  );

  return (
    <NetworkProviderContext.Provider value={value}>
      {children}
    </NetworkProviderContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkProviderContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};
