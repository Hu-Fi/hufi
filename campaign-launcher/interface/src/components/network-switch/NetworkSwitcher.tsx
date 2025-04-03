import { FC, useState, MouseEvent } from 'react';
import { useAccount, useSwitchChain, useConfig } from 'wagmi';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

export const NetworkSwitcher: FC = () => {
  const { chain } = useAccount();
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

  return (
    <>
      <Button
        id="network-switch-button"
        onClick={handleClick}
        aria-controls={open ? 'network-switch-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        endIcon={<ArrowDropDownIcon />}
        sx={{
          background: '#E1E2F7',
          borderRadius: '40px',
          py: 1,
          px: 2,
          textTransform: 'none',
          fontWeight: 600,
          minWidth: '150px',
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          {chain?.name ?? 'Select Network'}
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
        PaperProps={{
          sx: {
            borderRadius: '16px',
            mt: 1,
            boxShadow:
              '0px 5px 5px -3px rgba(203, 207, 232, 0.5), 0px 8px 20px 1px rgba(133, 142, 198, 0.1), 0px 3px 64px 2px rgba(233, 235, 250, 0.2)',
          },
        }}
      >
        {chains.map((c) => (
          <MenuItem
            key={c.id}
            onClick={() => handleSelect(c.id)}
            selected={c.id === chain?.id}
          >
            <Typography variant="body2" fontWeight={600}>
              {c.name}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
