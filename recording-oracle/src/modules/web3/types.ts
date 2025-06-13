import type { Provider, Wallet } from 'ethers';

import type { ChainId } from '@/utils/chain';

export type Chain = {
  id: ChainId;
  rpcUrl: string;
};

export type WalletWithProvider = Wallet & { provider: Provider };
