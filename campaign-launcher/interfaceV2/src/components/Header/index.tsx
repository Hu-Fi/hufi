import { FC } from 'react';

import { AppBar, Box, Button, Link as MuiLink, Toolbar } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

import logo from '../../assets/logo.svg';
import { ROUTES } from '../../constants';
import Account from '../Account';
import CampaignsMenu from '../CampaignsMenu';
import ConnectWallet from '../ConnectWallet';
import Container from '../Container';
import LaunchCampaign from '../LaunchCampaign';

const Header: FC = () => {
  const { isConnected } = useAccount();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'background.default',
        boxShadow: 'none',
        width: '100%',
        '& .MuiToolbar-root': {
          px: 0,
        },
      }}
    >
      <Container>
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            height: '90px',
            py: 3,
          }}
        >
          <Link to="/">
            <img src={logo} alt="HuFi" width={87} height={32} />
          </Link>
          <Box display="flex" gap={2} alignItems="center" height="100%">
            <MuiLink
              to={ROUTES.DASHBOARD}
              component={Link}
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Dashboard
            </MuiLink>
            <CampaignsMenu />
            <MuiLink
              to={import.meta.env.VITE_APP_STAKING_DASHBOARD_URL}
              target="_blank"
              component={Link}
            >
              <Button
                variant="text"
                size="medium"
                sx={{ color: 'primary.main', fontWeight: 600, height: '100%' }}
              >
                Stake HMT
              </Button>
            </MuiLink>
            <LaunchCampaign variant="outlined" />
            {!isConnected && <ConnectWallet />}
            {isConnected && <Account />}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
