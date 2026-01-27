import { NETWORKS, ChainId } from '@human-protocol/sdk';
import dayjs from 'dayjs';

export const PANCAKESWAP_BSC_SUBGRAPH = `https://gateway.thegraph.com/api/subgraphs/id/A1BC1hzDsK4NTeXBpKQnDBphngpYZAwDUF7dEBfa3jHK`;

export const MAX_PAGE_SIZE = 20;

/**
 * Max allowed time passed from last indexed swap in seconds
 */
export const MAX_ALLOWED_DELAY = dayjs.duration(1, 'minute').asSeconds();

export const tokenAddressBySymbol: Record<string, string> = {
  USDT: '0x55d398326f99059ff775485246999027b3197955',
  HMT: NETWORKS[ChainId.BSC_MAINNET]!.hmtAddress.toLowerCase(),
};
tokenAddressBySymbol.USDT0 = tokenAddressBySymbol.USDT;
