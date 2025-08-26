import type { Provider, Wallet } from 'ethers';

import type { ChainId } from '@/common/constants';

export type Chain = {
  id: ChainId;
  rpcUrl: string;
};

export type WalletWithProvider = Wallet & { provider: Provider };
