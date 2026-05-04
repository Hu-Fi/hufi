import type { FC, PropsWithChildren } from 'react';

import { ChainId } from '@human-protocol/sdk/dist/enums';
import { http, createConfig, WagmiProvider as WWagmiProvider } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { walletConnect, coinbaseWallet } from 'wagmi/connectors';

import { isMainnet } from '@/constants';

const projectId = import.meta.env.VITE_APP_WALLETCONNECT_PROJECT_ID;

export const config = isMainnet
  ? createConfig({
      chains: [polygon],
      connectors: [
        walletConnect({ projectId }),
        coinbaseWallet({ appName: 'HuFi' }),
      ],
      syncConnectedChain: false,
      transports: {
        [polygon.id]: http(),
      },
    })
  : createConfig({
      chains: [polygonAmoy],
      connectors: [
        walletConnect({ projectId }),
        coinbaseWallet({ appName: 'HuFi' }),
      ],
      syncConnectedChain: false,
      transports: {
        [polygonAmoy.id]: http(),
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
