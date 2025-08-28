import { FC, MouseEvent, useEffect, useRef, useState } from "react"

import { ChainId } from "@human-protocol/sdk"
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, IconButton, Tooltip, Typography } from "@mui/material"

import { useIsMobile } from "../../hooks/useBreakpoints";
import { OpenInNewIcon } from "../../icons"
import { formatAddress, getExplorerUrl } from "../../utils"

type Props = {
  address: string;
  chainId: ChainId;
}

const handleOpenInExplorerClick = (
  e: MouseEvent<HTMLButtonElement>,
  chainId: ChainId,
  address: string
) => {
  e.stopPropagation();
  const explorerUrl = getExplorerUrl(chainId, address);
  window.open(explorerUrl, '_blank');
};

const CampaignAddress: FC<Props> = ({ address, chainId }) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const isMobile = useIsMobile();

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
  }

  return (
    <Box 
      display="flex" 
      alignItems="center" 
      minWidth="250px"
      maxWidth={{ xs: "100%", sm: "fit-content" }}
      flexGrow={1}
      flexShrink={1}
      gap={1} 
      py={2} 
      px={3} 
      borderRadius="40px" 
      border="1px solid" 
      borderColor="divider"
    >
      <Typography 
        variant="subtitle2" 
        textOverflow="ellipsis" 
        overflow="hidden" 
        whiteSpace="nowrap"
      >
        {isMobile ? formatAddress(address) : address}
      </Typography>
      <IconButton
        disabled={isCopied}
        onClick={handleCopyClick}
        sx={{
          color: 'text.secondary',
          p: 0,
          ml: 2,
          '&:hover': { background: 'none' },
        }}
      >
        <Tooltip title="Copied" placement="top" open={isCopied}>
          <ContentCopyIcon />
        </Tooltip>
      </IconButton>
      <IconButton
        onClick={(e) => handleOpenInExplorerClick(e, chainId, address)}
        sx={{
          color: 'text.secondary',
          p: 0,
          '&:hover': { background: 'none' },
        }}
      >
        <OpenInNewIcon />
      </IconButton>
    </Box>
  )
}

export default CampaignAddress;
