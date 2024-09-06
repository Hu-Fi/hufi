import { FC, MouseEvent, useState } from 'react';

import { ChainId, NETWORKS } from '@human-protocol/sdk';
import {
  ArrowDropDown as ArrowDropDownIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuProps,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ethers } from 'ethers';
import { useAccount, useDisconnect } from 'wagmi';

import { WalletModal } from './WalletModal';
import profileSvg from '../../assets/profile.svg';
import { useWalletBalance } from '../../hooks';
import { useAuthentication } from '../../hooks/recording-oracle';
import { shortenAddress } from '../../utils/address';
import { CopyLinkIcon, OpenInNewIcon } from '../icons';

const ProfileMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
))(() => ({
  '& .MuiPaper-root': {
    borderRadius: '16px',
    boxShadow:
      '0px 5px 5px -3px rgba(203, 207, 232, 0.5), 0px 8px 20px 1px rgba(133, 142, 198, 0.1), 0px 3px 64px 2px rgba(233, 235, 250, 0.2)',
    padding: 24,
  },
}));

export const ConnectWallet: FC = () => {
  const { address, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { signOut } = useAuthentication();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const toggleWalletModal = () => setModalOpen(!modalOpen);

  const walletBalance = useWalletBalance();

  const network = NETWORKS[chainId as ChainId];
  const accountUrl = `${network?.scanUrl}/address/${address}`;

  if (!address) {
    return (
      <>
        <Button
          sx={{
            borderRadius: '4px',
            padding: '6px 16px',
            lineHeight: '24px',
          }}
          variant="outlined"
          color="primary"
          onClick={toggleWalletModal}
        >
          Connect Wallet
        </Button>
        <WalletModal open={modalOpen} onClose={toggleWalletModal} />
      </>
    );
  }

  const walletBalanceFormatted = ethers.formatUnits(
    walletBalance.value || 0,
    walletBalance.decimals
  );

  return (
    <>
      <Button
        id="profile-button"
        sx={{ background: '#E1E2F7', py: 1, borderRadius: '40px', pr: 2 }}
        onClick={handleClick}
        aria-controls={open ? 'profile-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        endIcon={<ArrowDropDownIcon />}
      >
        <img src={profileSvg} alt="profile" />
        <Typography variant="body2" fontWeight={600} sx={{ ml: 1 }}>
          {shortenAddress(address)}
        </Typography>
      </Button>
      <ProfileMenu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'profile-button',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src={profileSvg} alt="profile" />
            <Typography variant="body2" fontWeight={600} sx={{ ml: 1 }}>
              {shortenAddress(address)}
            </Typography>
          </Box>
          <Stack direction="row" sx={{ ml: 3 }} spacing="10px">
            <Tooltip title="Copy Address">
              <IconButton
                color="primary"
                sx={{ background: '#F6F7FE' }}
                onClick={() => navigator.clipboard.writeText(address)}
              >
                <CopyLinkIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Explore account on Blockchain Scan">
              <IconButton
                color="primary"
                sx={{ background: '#F6F7FE' }}
                onClick={() => window.open(accountUrl)}
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Disconnect">
              <IconButton
                color="primary"
                sx={{ background: '#F6F7FE' }}
                onClick={() => {
                  disconnect();
                  signOut();
                  setModalOpen(false);
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        <Typography variant="h4" fontWeight={600} textAlign="center" mt={4}>
          {(+walletBalanceFormatted).toFixed(2)} HMT
        </Typography>
        <Typography
          color="text.secondary"
          variant="h5"
          textAlign="center"
          mt={1}
        >
          {walletBalanceFormatted && walletBalance?.usdPrice
            ? `$ ${(+walletBalanceFormatted * walletBalance.usdPrice).toFixed(2)}`
            : ''}
        </Typography>
      </ProfileMenu>
    </>
  );
};
