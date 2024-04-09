import { Menu as MenuIcon } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FC, useState } from 'react';
import { Link } from 'react-router-dom';

import logoSvg from '../assets/logo.svg';
import { ConnectWallet } from '../components/connect-wallet';
import { SocialIcons } from '../components/social-icons';

type NavLink = {
  title: string;
  href: string;
  external?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { title: 'Create a campaign', href: '/create-campaign' },
  { title: 'Stake HMT', href: '/stake-hmt' },
  { title: 'HUMAN Website', href: 'https://humanprotocol.org', external: true },
];

export const Header: FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isDownLg = useMediaQuery(theme.breakpoints.down('lg'));

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const renderNavLinks = () => (
    <Stack direction="row" spacing={2}>
      {NAV_LINKS.map((nav) => (
        <Link
          key={nav.title}
          to={nav.href}
          target={nav.external ? '_blank' : '_self'}
          style={{ textDecoration: 'none', padding: '6px 8px' }}
        >
          <Typography color="primary" variant="body2" fontWeight={600}>
            {nav.title}
          </Typography>
        </Link>
      ))}
    </Stack>
  );

  const renderMobileLinks = () => (
    <Box>
      {NAV_LINKS.map((nav) => (
        <Link
          key={nav.title}
          to={nav.href}
          target={nav.external ? '_blank' : '_self'}
          style={{
            textDecoration: 'none',
            padding: '20px 32px',
            borderBottom: '1px solid #E9EBFA',
            display: 'block',
          }}
        >
          <Typography color="primary" variant="body2" fontWeight={400}>
            {nav.title}
          </Typography>
        </Link>
      ))}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          background: 'rgba(255, 255, 255, 0.8)',
          boxShadow: 'none',
          backdropFilter: 'blur(9px)',
        }}
      >
        <Toolbar disableGutters>
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                height: '88px',
                boxSizing: 'border-box',
                padding: {
                  xs: '29px 24px',
                  md: '29px 77px 20px 60px',
                },
              }}
            >
              <Link
                to="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                <Box
                  component="img"
                  src={logoSvg}
                  alt="logo"
                  sx={{ width: { xs: '100px', md: '118px' } }}
                />
                <Typography
                  sx={{
                    fontSize: { xs: '14px', md: '16px' },
                    lineHeight: { xs: 1, md: 1.5 },
                    letterSpacing: '0.15px',
                  }}
                  color="primary"
                  ml="10px"
                >
                  Campaign Launcher
                </Typography>
              </Link>
              {!isDownLg && (
                <Box display="flex" alignItems="center" gap={3}>
                  {renderNavLinks()}
                  <ConnectWallet />
                </Box>
              )}
              {isDownLg && (
                <Box>
                  <IconButton
                    color="primary"
                    sx={{ ml: 1 }}
                    onClick={toggleDrawer}
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="top"
        open={drawerOpen}
        onClose={toggleDrawer}
        SlideProps={{ appear: false }}
        PaperProps={{ sx: { top: '88px', bottom: '0px' } }}
        sx={{
          top: '88px',
          '& .MuiBackdrop-root': {
            top: '88px',
          },
        }}
      >
        <Box height="100%" position="relative">
          {renderMobileLinks()}
          <Box px={4} py="26px">
            <ConnectWallet />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: '32px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <SocialIcons />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};
