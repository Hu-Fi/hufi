import { ChainId } from '@human-protocol/sdk';

// TODO: Read USDT contract address from Human Protocol SDK
export const USDT_CONTRACT_ADDRESS: Partial<Record<ChainId, string>> = {
  [ChainId.POLYGON_AMOY]: '0x0E1fB03d02F3205108DE0c6a2b0B6B68e13D767e',
};

// TODO: Read HUSD contract address from Human Protocol SDK
export const HUSD_CONTRACT_ADDRESS: Partial<Record<ChainId, string>> = {
  [ChainId.POLYGON_AMOY]: '0x6d15C4c6B58F9C80e1e34cbeB717aa7c4FF7B87c',
};

// TODO: Make these values configurable
export const HUSD_MARKET_MAKING_CAMPAIGN_EXCHANGES = ['exin1', '4swap'];
export const HUSD_MARKET_MAKING_CAMPAIGN_FUND_AMOUNT = '0.000001';
export const HUSD_MARKET_MAKING_CAMPAIGN_DURATION = 2592000; // 30 days in seconds