import { FC, PropsWithChildren } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { http, createConfig, WagmiProvider as WWagmiProvider } from 'wagmi';
import { walletConnect, coinbaseWallet } from 'wagmi/connectors';

import { MAINNET_CHAINS, TESTNET_CHAINS } from '../constants';

const projectId = import.meta.env.VITE_APP_WALLETCONNECT_PROJECT_ID;
const isMainnet = import.meta.env.VITE_APP_WEB3_ENV === 'mainnet';

export const config = isMainnet ? createConfig({
  chains: MAINNET_CHAINS,
  connectors: [
    walletConnect({ projectId }),
    coinbaseWallet({ appName: 'HuFi' }),
  ],
  syncConnectedChain: false,
  transports: Object.fromEntries(
    MAINNET_CHAINS.map(chain => [chain.id, http()])
  ) as Record<(typeof MAINNET_CHAINS)[number]['id'], ReturnType<typeof http>>,
}) : createConfig({
  chains: TESTNET_CHAINS,
  connectors: [
    walletConnect({ projectId }),
    coinbaseWallet({ appName: 'HuFi' }),
  ],
  syncConnectedChain: false,
  transports: Object.fromEntries(
    TESTNET_CHAINS.map(chain => [chain.id, http()])
  ) as Record<(typeof TESTNET_CHAINS)[number]['id'], ReturnType<typeof http>>,
});

const WagmiProvider: FC<PropsWithChildren> = ({ children }) => {
  const initialState = {
    chainId: isMainnet ? ChainId.POLYGON : ChainId.POLYGON_AMOY,
    connections: new Map(),
    current: null,
    status: 'disconnected' as const,
  };

  return (
    <WWagmiProvider config={config} initialState={initialState}>
      {children}
    </WWagmiProvider>
  );
};

export default WagmiProvider;
