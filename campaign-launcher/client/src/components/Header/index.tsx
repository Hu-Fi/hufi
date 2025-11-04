import { type FC, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Link as MuiLink,
  type SxProps,
  Toolbar,
} from '@mui/material';
import { Link } from 'react-router-dom';

import logo from '@/assets/logo.svg';
import Account from '@/components/Account';
import ConnectWallet from '@/components/ConnectWallet';
import Container from '@/components/Container';
import LaunchCampaign from '@/components/LaunchCampaign';
import NetworkSwitcher from '@/components/NetworkSwitcher';
import { ROUTES } from '@/constants';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

type StyledLinkProps = {
  to: string;
  text: string;
  sx?: SxProps;
  target?: string;
  onClick?: () => void;
};

const StyledLink = ({ to, text, sx, target, onClick }: StyledLinkProps) => {
  return (
    <MuiLink
      to={to}
      component={Link}
      target={target}
      onClick={onClick}
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
  );
};

const STAKING_DASHBOARD_URL = import.meta.env.VITE_APP_STAKING_DASHBOARD_URL;

const Header: FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isAuthenticated } = useWeb3Auth();

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
            <StyledLink
              to={STAKING_DASHBOARD_URL}
              text="Stake HMT"
              target="_blank"
            />
            <NetworkSwitcher />
            <LaunchCampaign variant="outlined" withTooltip />
            {isAuthenticated ? <Account /> : <ConnectWallet />}
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
              <StyledLink
                to={STAKING_DASHBOARD_URL}
                text="Stake HMT"
                target="_blank"
              />
              <NetworkSwitcher />
              <LaunchCampaign variant="outlined" />
              {isAuthenticated ? <Account /> : <ConnectWallet />}
            </Box>
          </Drawer>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
