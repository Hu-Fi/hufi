import { FC, useState } from 'react';

import { Avatar, Button, Popover, Typography } from '@mui/material';
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi';

import { AvatarIcon, ArrowDownIcon, PowerIcon } from '../../icons';
import { useAuthentication } from '../../providers/AuthProvider';
import { formatAddress } from '../../utils';

const Account: FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { signOut } = useAuthentication();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  const formattedAddress = formatAddress(address);

  const handleClosePopover = () => setAnchorEl(null);

  const handleDisconnect = () => {
    disconnect();
    signOut();
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
        <Button
          onClick={handleDisconnect}
          sx={{
            color: 'primary.light',
            p: 1,
            width: '100%',
            fontWeight: 600,
            justifyContent: 'flex-start',
            gap: 1,
            '&:hover': {
              backgroundColor: 'unset',
            },
          }}
        >
          <PowerIcon />
          Disconnect wallet
        </Button>
      </Popover>
    </>
  );
};

export default Account;
