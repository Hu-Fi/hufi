import { ChainId } from '@human-protocol/sdk';

export const TESTNET_CHAIN_IDS = [
  ChainId.BSC_TESTNET,
  ChainId.POLYGON_AMOY,
  ChainId.SEPOLIA,
];

export const MAINNET_CHAIN_IDS = [
  ChainId.BSC_MAINNET,
  ChainId.POLYGON,
  ChainId.MOONBEAM,
];

export const SUPPORTED_CHAIN_IDS = [
  //   ChainId.MAINNET,
  //   ChainId.SEPOLIA,
  //   ChainId.BSC_MAINNET,
  //   ChainId.BSC_TESTNET,
  ChainId.POLYGON,
  ChainId.POLYGON_AMOY,
  //   ChainId.MOONBEAM,
  //   ChainId.MOONBASE_ALPHA,
  //   ChainId.CELO,
  //   ChainId.CELO_ALFAJORES,
];

export const LOCALHOST_CHAIN_IDS = [ChainId.LOCALHOST];
