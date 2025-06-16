import { ChainId as SdkChainId } from '@human-protocol/sdk';

import Environment from '@/utils/environment';

export enum ProductionChainId {
  POLYGON_MAINNET = SdkChainId.POLYGON,
}

export enum DevelopmentChainId {
  SEPOLIA = SdkChainId.SEPOLIA,
  POLYGON_AMOY = SdkChainId.POLYGON_AMOY,
  LOCALHOST = SdkChainId.LOCALHOST,
}

export const ChainIds = Object.values(
  Environment.isProduction() ? ProductionChainId : DevelopmentChainId,
).filter((value): value is ChainId => typeof value === 'number');

export type ChainId = ProductionChainId | DevelopmentChainId;
