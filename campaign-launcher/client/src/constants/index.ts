import { ChainId } from '@human-protocol/sdk';

export const isMainnet = import.meta.env.VITE_APP_WEB3_ENV === 'mainnet';

export const ROUTES = {
  DASHBOARD: '/',
  CAMPAIGN_DETAILS: '/campaign-details/:address',
  MANAGE_API_KEYS: '/manage-api-keys',
};

export const oracles = {
  exchangeOracle: import.meta.env.VITE_APP_EXCHANGE_ORACLE_ADDRESS,
  recordingOracle: import.meta.env.VITE_APP_RECORDING_ORACLE_ADDRESS,
  reputationOracle: import.meta.env.VITE_APP_REPUTATION_ORACLE_ADDRESS,
};

// TODO: Read USDT contract address from Human Protocol SDK
export const USDT_CONTRACT_ADDRESS: Partial<Record<ChainId, string>> = {
  [ChainId.LOCALHOST]: '0xc5a5C42992dECbae36851359345FE25997F5C42d',
  [ChainId.POLYGON]: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  [ChainId.POLYGON_AMOY]: '0x0E1fB03d02F3205108DE0c6a2b0B6B68e13D767e',
  [ChainId.SEPOLIA]: '0x6A3267e048B80FC2Fbd52510508c1eb884F0fDb1',
};

export const USDC_CONTRACT_ADDRESS: Partial<Record<ChainId, string>> = {
  [ChainId.POLYGON]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  [ChainId.POLYGON_AMOY]: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582',
  [ChainId.SEPOLIA]: '0xf08A50178dfcDe18524640EA6618a1f965821715',
};

export const TESTNET_CHAIN_IDS = [
  ChainId.SEPOLIA,
  ChainId.POLYGON_AMOY,
  ChainId.AURORA_TESTNET,
];
export const MAINNET_CHAIN_IDS = [ChainId.MAINNET, ChainId.POLYGON];
export const LOCALHOST_CHAIN_IDS = [ChainId.LOCALHOST];

export const MQ_MOBILE = 'screen and (max-width: 600px)';

export const INTERNAL_SERVER_ERROR = 'Internal server error';
export const DEFAULT_ERROR_MESSAGE = 'An error occurred, please try again.';
