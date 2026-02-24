import { type FC, type MouseEvent, useEffect, useRef, useState } from 'react';

import type { ChainId } from '@human-protocol/sdk';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  IconButton,
  Tooltip,
  Typography,
  type TypographyProps,
} from '@mui/material';

import { OpenInNewIcon } from '@/icons';
import { formatAddress, getExplorerUrl } from '@/utils';

type Props = {
  address: string;
  chainId: ChainId;
  withCopy?: boolean;
  variant?: TypographyProps['variant'];
};

const iconButtonSx = {
  color: 'text.primary',
  p: 0,
  zIndex: 1,
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

const CampaignAddress: FC<Props> = ({
  address,
  chainId,
  withCopy = false,
  variant = 'subtitle2',
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

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
    <Typography variant={variant} display="flex" alignItems="center" gap={1}>
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
