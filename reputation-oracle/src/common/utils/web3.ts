import { ChainId, NETWORKS } from '@human-protocol/sdk';

import { USDT_CONTRACT_ADDRESS } from '@/common/constants';

export function getTokenDecimals(
  chainId: number,
  tokenAddress: string,
): number {
  const _tokenAddress = tokenAddress.toLowerCase();

  let decimals: number;
  switch (_tokenAddress) {
    case USDT_CONTRACT_ADDRESS[chainId]?.toLowerCase():
      decimals = 6;
      break;
    case NETWORKS[chainId as ChainId]?.hmtAddress.toLowerCase():
      decimals = 18;
      break;
    default: {
      throw new Error("Can't parse amount for unknown token");
    }
  }

  return decimals;
}
