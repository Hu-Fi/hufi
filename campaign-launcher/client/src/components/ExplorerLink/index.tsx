import { FC, MouseEvent } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { IconButton, Typography } from '@mui/material';

import { OpenInNewIcon } from '../../icons';
import { formatAddress, getExplorerUrl } from '../../utils';

type Props = {
  address: string;
  chainId: ChainId;
};

const handleAddressClick = (
  e: MouseEvent<HTMLButtonElement>,
  chainId: ChainId,
  address: string
) => {
  e.stopPropagation();
  const explorerUrl = getExplorerUrl(chainId, address);
  window.open(explorerUrl, '_blank');
};

const ExplorerLink: FC<Props> = ({ address, chainId }) => {
  return (
    <Typography variant="subtitle2" display="flex" alignItems="center">
      {formatAddress(address)}
      <IconButton
        onClick={(e) => handleAddressClick(e, chainId, address)}
        sx={{
          color: 'text.secondary',
          ml: 1,
          p: 0,
          '&:hover': { background: 'none' },
        }}
      >
        <OpenInNewIcon />
      </IconButton>
    </Typography>
  );
};

export default ExplorerLink;
