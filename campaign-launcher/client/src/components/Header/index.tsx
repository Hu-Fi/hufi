import { FC, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  Link as MuiLink,
  Toolbar,
} from '@mui/material';
import { Link } from 'react-router-dom';

import logo from '../../assets/logo.svg';
import { ROUTES } from '../../constants';
import useRetrieveSigner from '../../hooks/useRetrieveSigner';
import Account from '../Account';
import ConnectWallet from '../ConnectWallet';
import Container from '../Container';
import LaunchCampaign from '../LaunchCampaign';
import NetworkSwitcher from '../NetworkSwitcher';

const Header: FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { signer } = useRetrieveSigner();

  const toggleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
  };

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
          <Link to={ROUTES.DASHBOARD}>
            <img src={logo} alt="HuFi" width={87} height={32} />
          </Link>
          <Box
            display={{ xs: 'none', md: 'flex' }}
            gap={2}
            alignItems="center"
            height="100%"
          >
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
            <MuiLink
              to={import.meta.env.VITE_APP_STAKING_DASHBOARD_URL}
              target="_blank"
              component={Link}
            >
              <Button
                variant="text"
                size="medium"
                sx={{ color: 'primary.main', height: '100%' }}
              >
                Stake HMT
              </Button>
            </MuiLink>
            <NetworkSwitcher />
            <LaunchCampaign variant="outlined" />
            {signer ? <Account /> : <ConnectWallet />}
          </Box>

          <IconButton
            edge="start"
            sx={{ display: { xs: 'block', md: 'none' }, color: 'primary.main' }}
            onClick={() => toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>

          <Drawer
            anchor="right"
            open={isDrawerOpen}
            onClose={() => toggleDrawer(false)}
            slotProps={{
              paper: {
                sx: { width: '75%', bgcolor: 'background.default' },
              },
            }}
          >
            <Box
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                textAlign: 'center',
                gap: 2,
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              <IconButton
                onClick={() => toggleDrawer(false)}
                sx={{
                  color: 'primary.main',
                  position: 'absolute',
                  top: 10,
                  right: 10,
                }}
              >
                <CloseIcon />
              </IconButton>
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
              <MuiLink
                to={import.meta.env.VITE_APP_STAKING_DASHBOARD_URL}
                target="_blank"
                component={Link}
              >
                <Button
                  variant="text"
                  size="medium"
                  sx={{ color: 'primary.main', height: '100%' }}
                >
                  Stake HMT
                </Button>
              </MuiLink>
              <NetworkSwitcher />
              <LaunchCampaign variant="outlined" />
              {signer ? <Account /> : <ConnectWallet />}
            </Box>
          </Drawer>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
