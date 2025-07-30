import { FC, useState } from 'react';

import { Avatar, Button, List, ListItemButton, Popover, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi';

import { AvatarIcon, ArrowDownIcon, PowerIcon, ApiKeyIcon } from '../../icons';
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
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { logout } = useWeb3Auth();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });
  const navigate = useNavigate();

  const formattedAddress = formatAddress(address);

  const handleClosePopover = () => setAnchorEl(null);

  const handleGoToManageApiKeys = () => {
    handleClosePopover();
    navigate('/manage-api-keys');
  };

  const handleLogout = () => {
    logout();
    disconnect();
  };

  return (
    <>
      <Button
        aria-describedby="account-popover"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disableRipple
        sx={{
          bgcolor: 'primary.main',
          borderRadius: '4px',
          height: '42px',
          width: '195px',
          paddingX: 1,
          fontWeight: 600,
          borderBottomLeftRadius: anchorEl ? 0 : 4,
          borderBottomRightRadius: anchorEl ? 0 : 4,
        }}
      >
        {ensAvatar ? (
          <Avatar
            alt="ENS Avatar"
            src={ensAvatar}
            sx={{ width: 24, height: 24 }}
          />
        ) : (
          <AvatarIcon />
        )}
        <Typography
          color="primary.light"
          fontSize="14px"
          fontWeight={600}
          px={1}
        >
          {formattedAddress}
        </Typography>
        <ArrowDownIcon
          sx={{
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
        <List sx={{ p: 0 }}>
          <ListItemButton
            sx={buttonSx}
            onClick={handleGoToManageApiKeys}
          >
            <ApiKeyIcon />
            Manage API Keys
          </ListItemButton>
          <ListItemButton
            sx={buttonSx}
            onClick={handleLogout}
          >
            <PowerIcon />
            Disconnect wallet
          </ListItemButton>
        </List>
      </Popover>
    </>
  );
};

export default Account;
