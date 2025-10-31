import { type FC, type MouseEvent, useState } from 'react';

import type { ChainId } from '@human-protocol/sdk';
import { Button, Menu, MenuItem, Typography } from '@mui/material';
import { useConfig } from 'wagmi';

import { useIsMobile } from '@/hooks/useBreakpoints';
import { ChevronIcon } from '@/icons';
import { useNetwork } from '@/providers/NetworkProvider';
import { getChainIcon, getSupportedChainIds } from '@/utils';

const NetworkSwitcher: FC = () => {
  const config = useConfig();
  const { chains } = config;
  const { appChainId, setAppChainId } = useNetwork();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isMobile = useIsMobile();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (selectedChainId: ChainId) => {
    setAppChainId(selectedChainId);
    handleClose();
  };

  return (
    <>
      <Button
        id="network-switch-button"
        onClick={handleClick}
        aria-controls={open ? 'network-switch-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        endIcon={
          <ChevronIcon
            sx={{
              transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out',
            }}
          />
        }
        sx={{
          bgcolor: { xs: 'transparent', md: 'background.default' },
          p: { xs: 0, md: 1 },
          height: { xs: '30px', md: '42px' },
          textTransform: 'none',
          gap: { xs: 1, md: 0 },
          width: { xs: 'fit-content', md: 'auto' },
        }}
      >
        {getChainIcon(appChainId)}
        {isMobile ? chains.find((c) => c.id === appChainId)?.name : ''}
      </Button>

      <Menu
        id="network-switch-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              bgcolor: 'background.default',
              borderRadius: '16px',
              mt: 1,
            },
          },
        }}
      >
        {chains.map((c) => {
          if (!getSupportedChainIds().includes(c.id as ChainId)) return null;
          return (
            <MenuItem
              key={c.id}
              onClick={() => handleSelect(c.id)}
              selected={c.id === appChainId}
            >
              <Typography variant="body2" fontWeight={600}>
                {c.name}
              </Typography>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default NetworkSwitcher;
