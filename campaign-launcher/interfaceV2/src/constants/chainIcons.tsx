import { ReactElement } from 'react';

import { ChainId } from '@human-protocol/sdk';

import { AuroraIcon } from '../icons/chainIcons/AuroraIcon';
import { EthereumIcon } from '../icons/chainIcons/EthereumIcon';
import { HumanIcon } from '../icons/chainIcons/HumanIcon';
import { PolygonIcon } from '../icons/chainIcons/PolygonIcon';

export const CHAIN_ICONS: { [chainId in ChainId]?: ReactElement } = {
  [ChainId.ALL]: <HumanIcon />,
  [ChainId.MAINNET]: <EthereumIcon />,
  [ChainId.SEPOLIA]: <EthereumIcon />,
  [ChainId.POLYGON]: <PolygonIcon />,
  [ChainId.POLYGON_AMOY]: <PolygonIcon />,
  [ChainId.AURORA_TESTNET]: <AuroraIcon />,
};
