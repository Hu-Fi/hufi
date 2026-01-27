import { ChainId as SdkChainId } from '@human-protocol/sdk';

export const ERC20_ABI_DECIMALS = [
  'function decimals() view returns (uint8)',
] as const;

export const ERC20_ABI_SYMBOL = [
  'function symbol() view returns (string)',
] as const;

export const ETH_TOKEN_SYMBOL = 'ETH';

export const ETH_USDT_PAIR = 'ETH/USDT';

export const USDT_TOKEN_ADDRESS: Partial<Record<SdkChainId, string>> = {
  [SdkChainId.BSC_MAINNET]: '0x55d398326f99059fF775485246999027B3197955',
};
