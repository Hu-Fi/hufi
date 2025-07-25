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
  return <WWagmiProvider config={config}>{children}</WWagmiProvider>;
};

export default WagmiProvider;
