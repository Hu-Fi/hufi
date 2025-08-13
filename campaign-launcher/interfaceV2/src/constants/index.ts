import { ChainId } from '@human-protocol/sdk';

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

// TODO: Read HUSD contract address from Human Protocol SDK
export const HUSD_CONTRACT_ADDRESS: Partial<Record<ChainId, string>> = {
  [ChainId.LOCALHOST]: '0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E',
  [ChainId.POLYGON_AMOY]: '0x6d15C4c6B58F9C80e1e34cbeB717aa7c4FF7B87c',
  [ChainId.SEPOLIA]: '0xF15D41e06FE329427c643Ed2203F14C409cb4b85',
};

// TODO: Make these values configurable
export const HUSD_MARKET_MAKING_CAMPAIGN_EXCHANGES = ['uniswap'];
export const HUSD_MARKET_MAKING_CAMPAIGN_DURATION = 2592000; // 30 days in seconds

export const TESTNET_CHAIN_IDS = [ChainId.SEPOLIA, ChainId.POLYGON_AMOY, ChainId.AURORA_TESTNET];
export const MAINNET_CHAIN_IDS = [ChainId.MAINNET, ChainId.POLYGON];
export const LOCALHOST_CHAIN_IDS = [ChainId.LOCALHOST];

export const MQ_MOBILE = 'screen and (max-width: 600px)';
