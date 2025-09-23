import { FC, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Link as MuiLink,
  SxProps,
  Toolbar,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

import logo from '../../assets/logo.svg';
import { ROUTES } from '../../constants';
import { useActiveAccount } from '../../providers/ActiveAccountProvider';
import Account from '../Account';
import ConnectWallet from '../ConnectWallet';
import Container from '../Container';
import LaunchCampaign from '../LaunchCampaign';
import NetworkSwitcher from '../NetworkSwitcher';

type StyledLinkProps = {
  to: string;
  text: string;
  sx?: SxProps;
  target?: string;
}

const StyledLink = ({ to, text, sx, target }: StyledLinkProps) => {
  return (
    <MuiLink
      to={to}
      component={Link}
      target={target}
      sx={{
        textDecoration: 'none',
        color: 'primary.main',
        fontWeight: 600,
        fontSize: '14px',
        ...sx,
      }}
    >
      {text}
    </MuiLink>
  )
}

const STAKING_DASHBOARD_URL = import.meta.env.VITE_APP_STAKING_DASHBOARD_URL;

const Header: FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { activeAddress } = useActiveAccount();
  const { isConnected } = useAccount();

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
            <StyledLink to={ROUTES.SUPPORT} text="Support" />
            <StyledLink to={ROUTES.DASHBOARD} text="Dashboard" />
            <StyledLink to={STAKING_DASHBOARD_URL} text="Stake HMT" target="_blank" />
            <NetworkSwitcher />
            <LaunchCampaign variant="outlined" withTooltip />
            {activeAddress && isConnected ? <Account /> : <ConnectWallet />}
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
                elevation: 0,
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
              <StyledLink to={ROUTES.SUPPORT} text="Support" />
              <StyledLink to={ROUTES.DASHBOARD} text="Dashboard" />
              <StyledLink to={STAKING_DASHBOARD_URL} text="Stake HMT" target="_blank"/>
              <NetworkSwitcher />
              <LaunchCampaign variant="outlined" />
              {activeAddress && isConnected ? <Account /> : <ConnectWallet />}
            </Box>
          </Drawer>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
