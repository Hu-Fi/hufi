import { NETWORKS, ChainId } from '@human-protocol/sdk';
import ms from 'ms';

export const PANCAKESWAP_BSC_SUBGRAPH = `https://gateway.thegraph.com/api/subgraphs/id/A1BC1hzDsK4NTeXBpKQnDBphngpYZAwDUF7dEBfa3jHK`;

export const MAX_PAGE_SIZE = 50;

export const tokenAddressBySymbol: Record<string, string | undefined> = {
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  HMT: NETWORKS[ChainId.BSC_MAINNET]!.hmtAddress,
};
tokenAddressBySymbol.USDT0 = tokenAddressBySymbol.USDT;

/**
 * Time in milliseconds that is allowed for historical data lookback
 */
export const MAX_LOOKBACK_MS = ms('4 days');
