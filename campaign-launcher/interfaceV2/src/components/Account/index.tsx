import { FC, useState } from 'react';

import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { Button, List, ListItemButton, Popover, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDisconnect } from 'wagmi';

import useRetrieveSigner from '../../hooks/useRetrieveSigner';
import { AvatarIcon, ChevronIcon, PowerIcon, ApiKeyIcon } from '../../icons';
import { useActiveAccount } from '../../providers/ActiveAccountProvider';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';
import { formatAddress } from '../../utils';

const buttonSx = {
  color: 'text.secondary',
  bgcolor: '#f5efff',
  p: 1,
  width: '100%',
  fontWeight: 600,
  fontSize: '13px',
  justifyContent: 'flex-start',
  gap: 1,
  borderBottom: '1px solid',
  borderBottomColor: 'rgba(205, 199, 255, 0.50)',
  '&:hover': {
    bgcolor: '#f5efff',
    color: 'primary.light',
  },
  '&:last-child': {
    borderBottom: 'none',
  },
};

const Account: FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { activeAddress, clearActiveAddress } = useActiveAccount();
  const { disconnect } = useDisconnect();
  const { signIn, logout, isAuthenticated } = useWeb3Auth();
  const { signer } = useRetrieveSigner();
  const navigate = useNavigate();

  const formattedAddress = formatAddress(activeAddress);

  const handleClosePopover = () => setAnchorEl(null);

  const handleGoToManageApiKeys = () => {
    navigate('/manage-api-keys');
  };

  const handleSignIn = () => {
    signIn();
  };

  const handleDisconnect = () => {
    disconnect();
    clearActiveAddress();
  };

  const handleLogout = () => {
    handleDisconnect();
    logout();
  };

  return (
    <>
      <Button
        size="medium"
        aria-describedby="account-popover"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disableRipple
        sx={{
          bgcolor: 'primary.main',
          borderRadius: '4px',
          height: '42px',
          width: 'fit-content',
          paddingX: 1,
          borderBottomLeftRadius: anchorEl ? 0 : 4,
          borderBottomRightRadius: anchorEl ? 0 : 4,
        }}
      >
        <AvatarIcon sx={{ width: 24, height: 24 }} />
        <Typography
          color="primary.light"
          fontSize="14px"
          fontWeight={600}
          px={1}
        >
          {formattedAddress}
        </Typography>
        <ChevronIcon
          sx={{
            color: 'primary.light',
            transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out',
          }}
        />
      </Button>
      <Popover
        id="account-popover"
        open={!!anchorEl}
        onClose={handleClosePopover}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              bgcolor: 'primary.main',
              width: anchorEl?.getBoundingClientRect().width,
              minWidth: 'fit-content',
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              border: 'none',
            },
          },
        }}
      >
        <List sx={{ p: 0 }} onClick={handleClosePopover}>
          {!isAuthenticated && (
            <ListItemButton
              sx={buttonSx}
              onClick={handleSignIn}
            >
              <LoginIcon />
              Sign In
            </ListItemButton>
          )}
          {!isAuthenticated && signer && (
            <ListItemButton
              sx={buttonSx}
              onClick={handleDisconnect}
            >
              <PowerIcon />
              Disconnect wallet
            </ListItemButton>
          )}
          {isAuthenticated && (
            <ListItemButton
              sx={buttonSx}
              onClick={handleGoToManageApiKeys}
            >
              <ApiKeyIcon />
              Manage API Keys
            </ListItemButton>
          )}
          {isAuthenticated && (
            <ListItemButton
              sx={buttonSx}
              onClick={handleLogout}
            >
              <LogoutIcon />
              Log Out
            </ListItemButton>
          )}
        </List>
      </Popover>
    </>
  );
};

export default Account;
