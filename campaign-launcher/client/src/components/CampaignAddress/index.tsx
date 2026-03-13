import { type FC, type MouseEvent, useEffect, useRef, useState } from 'react';

import type { ChainId } from '@human-protocol/sdk';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, IconButton, Link, Tooltip } from '@mui/material';

import { formatAddress, getExplorerUrl } from '@/utils';

type Props = {
  address: string;
  chainId: ChainId;
  withCopy?: boolean;
  size?: 'small' | 'medium' | 'large';
};

const AddressLink: FC<Props> = ({ address, chainId, size }) => {
  return (
    <Link
      href={getExplorerUrl(chainId, address)}
      target="_blank"
      sx={{
        fontSize:
          size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px',
        color: 'text.primary',
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
        textDecorationThickness: '12%',
        fontWeight: 600,
      }}
    >
      {formatAddress(address)}
    </Link>
  );
};

const CampaignAddress: FC<Props> = ({
  address,
  chainId,
  withCopy = false,
  size = 'medium',
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

  if (withCopy) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <AddressLink address={address} chainId={chainId} size={size} />
        <IconButton
          disabled={isCopied}
          onClick={handleCopyClick}
          sx={{
            color: 'text.primary',
            p: 0,
            zIndex: 1,
            '&:hover': { background: 'none' },
          }}
        >
          <Tooltip title="Copied" placement="top" open={isCopied}>
            <ContentCopyIcon />
          </Tooltip>
        </IconButton>
      </Box>
    );
  }

  return <AddressLink address={address} chainId={chainId} size={size} />;
};

export default CampaignAddress;
