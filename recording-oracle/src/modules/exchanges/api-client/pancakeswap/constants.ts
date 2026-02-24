import { NETWORKS, ChainId } from '@human-protocol/sdk';
import ms from 'ms';

export const PANCAKESWAP_BSC_SUBGRAPH = `https://gateway.thegraph.com/api/subgraphs/id/F6L7Zd1hoEc5FKATZjTMpFqwDEUNE3LRC4Z784RahMYH`;

export const MAX_PAGE_SIZE = 50;

export const tokenAddressBySymbol: Record<string, string | undefined> = {
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  HMT: NETWORKS[ChainId.BSC_MAINNET]!.hmtAddress,
};
tokenAddressBySymbol.USDT0 = tokenAddressBySymbol.USDT;

/**
 * Time in milliseconds that is allowed for historical data lookback.
 *
 * Subgraph that we rely on contains lots of data and queries for data
 * with filtering not by id can fail if indexer has to scan too far back.
 * 5-6 days should be ok atm, but set it to 4 just to get notified and
 * have a space for maneuver.
 */
export const MAX_LOOKBACK_MS = ms('4 days');
