import { FC, useState, MouseEvent } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { Button, Menu, MenuItem, Typography } from '@mui/material';
import { useAccount, useSwitchChain, useConfig } from 'wagmi';

import { ChevronIcon } from '../../icons';
import { getChainIcon, getSupportedChainIds } from '../../utils';

const NetworkSwitcher: FC = () => {
  const { chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { chains } = useConfig();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (chainId: number) => {
    switchChain?.({ chainId });
    handleClose();
  };

  if (!isConnected) return null;

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
          fontWeight: 600,
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          {getChainIcon(chain?.id as ChainId)}
          {chain?.name ? null : 'Select Network'}
        </Typography>
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
              selected={c.id === chain?.id}
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
