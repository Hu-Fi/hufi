import { ReactElement } from 'react';

import { ChainId } from '@human-protocol/sdk';

import { AvalancheIcon } from '../icons/chainIcons/AvalancheIcon';
import { BinanceSmartChainIcon } from '../icons/chainIcons/BinanceSmartChainIcon';
import { CeloIcon } from '../icons/chainIcons/CeloIcon';
import { EthereumIcon } from '../icons/chainIcons/EthereumIcon';
import { HumanIcon } from '../icons/chainIcons/HumanIcon';
import { MoonbaseAlphaIcon } from '../icons/chainIcons/MoonbaseAlphaIcon';
import { MoonbeamIcon } from '../icons/chainIcons/MoonbeamIcon';
import { PolygonIcon } from '../icons/chainIcons/PolygonIcon';

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
