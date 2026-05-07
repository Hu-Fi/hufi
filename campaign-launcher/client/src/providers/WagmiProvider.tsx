import type { FC, PropsWithChildren } from 'react';

import { ChainId } from '@human-protocol/sdk';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { polygon, polygonAmoy } from '@reown/appkit/networks';
import { AppKitProvider } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { ConnectMethod } from '@reown/appkit-controllers';
import { http, WagmiProvider as WWagmiProvider } from 'wagmi';

import logo from '@/assets/logo.svg';
import { isMainnet } from '@/constants';

const projectId = import.meta.env.VITE_APP_WALLETCONNECT_PROJECT_ID;
const termsUrl = import.meta.env.VITE_APP_TERMS_URL;
const privacyUrl = import.meta.env.VITE_APP_PRIVACY_URL;

const mainnetNetworks: [AppKitNetwork] = [polygon];
const testnetNetworks: [AppKitNetwork] = [polygonAmoy];

const networks = isMainnet ? mainnetNetworks : testnetNetworks;

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  syncConnectedChain: false,
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
});

export const config = wagmiAdapter.wagmiConfig;

const metadata = {
  name: 'HuFi',
  description: 'HuFi Campaign Launcher',
  url: window.location.origin,
  icons: [logo],
};

const appKitConfig = {
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  termsConditionsUrl: termsUrl,
  privacyPolicyUrl: privacyUrl,
  features: {
    email: false,
    socials: false as const,
    history: false,
    swaps: false,
    onramp: false,
    send: false,
    connectMethodsOrder: ['wallet'] as ConnectMethod[],
  },
};

const WagmiProvider: FC<PropsWithChildren> = ({ children }) => {
  const initialState = {
    chainId: isMainnet ? ChainId.POLYGON : ChainId.POLYGON_AMOY,
    connections: new Map(),
    current: null,
    status: 'disconnected' as const,
  };

  return (
    <AppKitProvider {...appKitConfig}>
      <WWagmiProvider config={config} initialState={initialState}>
        {children}
      </WWagmiProvider>
    </AppKitProvider>
  );
};

export default WagmiProvider;
