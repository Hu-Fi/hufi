import { ChainId } from '@human-protocol/sdk';

import {
  LOCALHOST_CHAIN_IDS,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
} from '../constants';

export const getSupportedChainIds = (): ChainId[] => {
  switch (import.meta.env.VITE_APP_WEB3_ENV) {
    case 'mainnet':
      return MAINNET_CHAIN_IDS;
    case 'testnet':
      return TESTNET_CHAIN_IDS;
    default:
      return LOCALHOST_CHAIN_IDS;
  }
};
