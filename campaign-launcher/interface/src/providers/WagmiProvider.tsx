import { FC, PropsWithChildren } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { http, createConfig, WagmiProvider as WWagmiProvider } from 'wagmi';
import {
  bsc,
  bscTestnet,
  localhost,
  mainnet,
  polygon,
  polygonAmoy,
  sepolia,
} from 'wagmi/chains';
// import { walletConnect } from 'wagmi/connectors';

// const walletConnectProjectId = import.meta.env
//   .VITE_APP_WALLETCONNECT_PROJECT_ID;

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}

export const config = createConfig({
  chains: [
    mainnet,
    sepolia,
    bsc,
    bscTestnet,
    polygon,
    polygonAmoy,
    {
      ...localhost,
      id: ChainId.LOCALHOST,
    },
  ],
  // connectors: [walletConnect({ projectId: walletConnectProjectId })],
  connectors: [],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
    [ChainId.LOCALHOST]: http(),
  },
});

export const WagmiProvider: FC<PropsWithChildren> = ({ children }) => {
  return <WWagmiProvider config={config}>{children}</WWagmiProvider>;
};
