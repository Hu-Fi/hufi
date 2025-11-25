import type { FC, PropsWithChildren } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { http, createConfig, WagmiProvider as WWagmiProvider } from 'wagmi';
import {
  mainnet,
  localhost,
  polygon,
  polygonAmoy,
  sepolia,
} from 'wagmi/chains';
import { walletConnect, coinbaseWallet } from 'wagmi/connectors';

import { isMainnet } from '@/constants';

const projectId = import.meta.env.VITE_APP_WALLETCONNECT_PROJECT_ID;

export const config = isMainnet
  ? createConfig({
      chains: [polygon, mainnet],
      connectors: [
        walletConnect({ projectId }),
        coinbaseWallet({ appName: 'HuFi' }),
      ],
      syncConnectedChain: false,
      transports: {
        [polygon.id]: http(),
        [mainnet.id]: http(),
      },
    })
  : createConfig({
      chains: [
        polygonAmoy,
        sepolia,
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
        [polygonAmoy.id]: http(),
        [sepolia.id]: http(),
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
