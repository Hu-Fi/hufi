import { ReactElement } from 'react';

import { ChainId } from '@human-protocol/sdk';

import { AvalancheIcon } from './AvalancheIcon';
import { BinanceSmartChainIcon } from './BinanceSmartChainIcon';
import { CeloIcon } from './CeloIcon';
import { EthereumIcon } from './EthereumIcon';
import { HumanIcon } from './HumanIcon';
import { MoonbaseAlphaIcon } from './MoonbaseAlphaIcon';
import { MoonbeamIcon } from './MoonbeamIcon';
import { PolygonIcon } from './PolygonIcon';

export const CHAIN_ICONS: { [chainId in ChainId]?: ReactElement } = {
  [ChainId.ALL]: <HumanIcon />,
  [ChainId.MAINNET]: <EthereumIcon />,
  [ChainId.SEPOLIA]: <EthereumIcon />,
  [ChainId.POLYGON]: <PolygonIcon />,
  [ChainId.POLYGON_AMOY]: <PolygonIcon />,
  [ChainId.BSC_MAINNET]: <BinanceSmartChainIcon />,
  [ChainId.BSC_TESTNET]: <BinanceSmartChainIcon />,
  [ChainId.MOONBEAM]: <MoonbeamIcon />,
  [ChainId.MOONBASE_ALPHA]: <MoonbaseAlphaIcon />,
  [ChainId.AVALANCHE]: <AvalancheIcon />,
  [ChainId.AVALANCHE_TESTNET]: <AvalancheIcon />,
  [ChainId.CELO]: <CeloIcon />,
  [ChainId.CELO_ALFAJORES]: <CeloIcon />,
};
