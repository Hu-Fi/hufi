import { FC, useState, MouseEvent } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { Button, Menu, MenuItem, Typography } from '@mui/material';
import { useConfig, useChainId, useSwitchChain } from 'wagmi';

import { ChevronIcon } from '../../icons';
import { getChainIcon, getSupportedChainIds } from '../../utils';

const NetworkSwitcher: FC = () => {
  const config = useConfig();
  const { chains } = config;
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (selectedChainId: number) => {
    config.setState((state) => ({
      ...state,
      chainId: selectedChainId,
    }));
    switchChain?.({ chainId: selectedChainId });
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
          bgcolor: 'background.default',
          py: 1,
          px: 1,
          height: '42px',
          textTransform: 'none',
        }}
      >
        {getChainIcon(chainId)}
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
              selected={c.id === chainId}
            >
              <Typography variant="body2" fontWeight={600}>
                {c.name}
              </Typography>
            </MenuItem>
          )
        })}
      </Menu>
    </>
  );
};

export default NetworkSwitcher;
