import { type FC, type MouseEvent, useEffect, useRef, useState } from 'react';

import type { ChainId } from '@human-protocol/sdk';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { IconButton, Tooltip, Typography } from '@mui/material';

import { OpenInNewIcon } from '@/icons';
import { formatAddress, getExplorerUrl } from '@/utils';

type Props = {
  address: string;
  chainId: ChainId;
  withCopy?: boolean;
};

const iconButtonSx = {
  color: 'text.secondary',
  p: 0,
  '&:hover': { background: 'none' },
};

const handleOpenInExplorerClick = (
  e: MouseEvent<HTMLButtonElement>,
  chainId: ChainId,
  address: string
) => {
  e.stopPropagation();
  const explorerUrl = getExplorerUrl(chainId, address);
  window.open(explorerUrl, '_blank');
};

const CampaignAddress: FC<Props> = ({ address, chainId, withCopy = false }) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopyClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (isCopied) return;

    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setIsCopied(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };

  return (
    <Typography variant="subtitle2" display="flex" alignItems="center" gap={1}>
      {formatAddress(address)}
      {withCopy && (
        <IconButton
          disabled={isCopied}
          onClick={handleCopyClick}
          sx={iconButtonSx}
        >
          <Tooltip title="Copied" placement="top" open={isCopied}>
            <ContentCopyIcon />
          </Tooltip>
        </IconButton>
      )}
      <IconButton
        onClick={(e) => handleOpenInExplorerClick(e, chainId, address)}
        sx={iconButtonSx}
      >
        <OpenInNewIcon />
      </IconButton>
    </Typography>
  );
};

export default CampaignAddress;
