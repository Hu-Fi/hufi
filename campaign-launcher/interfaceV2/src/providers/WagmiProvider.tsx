import { FC, PropsWithChildren } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { http, createConfig, WagmiProvider as WWagmiProvider } from 'wagmi';
import {
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
  localhost,
  mainnet,
  moonbaseAlpha,
  moonbeam,
  polygon,
  polygonAmoy,
  sepolia,
  skaleHumanProtocol,
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
    bsc,
    bscTestnet,
    polygon,
    polygonAmoy,
    moonbeam,
    moonbaseAlpha,
    avalanche,
    avalancheFuji,
    skaleHumanProtocol,
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
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
    [moonbeam.id]: http(),
    [moonbaseAlpha.id]: http(),
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
    [skaleHumanProtocol.id]: http(),
    [ChainId.LOCALHOST]: http(),
  },
});

const WagmiProvider: FC<PropsWithChildren> = ({ children }) => {
  return <WWagmiProvider config={config}>{children}</WWagmiProvider>;
};

export default WagmiProvider;
