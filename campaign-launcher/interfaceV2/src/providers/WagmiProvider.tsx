import { FC, PropsWithChildren } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { http, createConfig, WagmiProvider as WWagmiProvider } from 'wagmi';
import {
  mainnet,
  auroraTestnet,
  localhost,
  polygon,
  polygonAmoy,
  sepolia,
} from 'wagmi/chains';
import { walletConnect, coinbaseWallet } from 'wagmi/connectors';

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}

const projectId = import.meta.env.VITE_APP_WALLETCONNECT_PROJECT_ID;
const isMainnet = import.meta.env.VITE_APP_WEB3_ENV === 'mainnet';

export const config = createConfig({
  chains: [
    mainnet,
    sepolia,
    polygon,
    polygonAmoy,
    auroraTestnet,
    {
      ...localhost,
      id: ChainId.LOCALHOST,
    },
  ],
  connectors: [
    walletConnect({ projectId }),
    coinbaseWallet({ appName: 'HuFi' }),
  ],
  syncConnectedChain: false,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
    [auroraTestnet.id]: http(),
    [ChainId.LOCALHOST]: http(),
  },
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
