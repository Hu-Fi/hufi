import { FC, MouseEvent, useState } from "react"

import { ChainId } from "@human-protocol/sdk"
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, IconButton, Tooltip, Typography } from "@mui/material"

import { OpenInNewIcon } from "../../icons"
import { getExplorerUrl } from "../../utils"

type Props = {
  address: string;
  chainId: ChainId;
}

const handleAddressClick = (
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

  const handleCopy = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  }

  return (
    <Box display="flex" alignItems="center" width={{ xs: "100%", md: "auto" }} gap={1} py={2} px={3} borderRadius="40px" border="1px solid" borderColor="divider">
      <Typography variant="subtitle2" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap">
        {address}
      </Typography>
      <IconButton
        onClick={(e) => handleCopy(e)}
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
        onClick={(e) => handleAddressClick(e, chainId, address)}
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
