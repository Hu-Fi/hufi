import { FC, useState } from 'react';

import { Menu as MenuIcon } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Link } from 'react-router-dom';

import logoSvg from '../assets/logo.svg';
import { ConnectWallet } from '../components/connect-wallet';
import { SocialIcons } from '../components/social-icons';
import { PATHS } from '../routes';

type NavLink = {
  title: string;
  href?: string;
  children?: NavLink[];
  external?: boolean;
};

const NAV_LINKS: NavLink[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'Earn',
    children: [
      {
        title: 'Stake HMT',
        href: PATHS.STAKE_HMT,
      },
      {
        title: 'Mint HUSD',
        href: PATHS.MINT_HUSD,
      },
      {
        title: 'Create Campaign',
        href: PATHS.CREATE_CAMPAIGN,
      },
    ],
  },
  { title: 'HUMAN Website', href: 'https://humanprotocol.org', external: true },
];

export const Header: FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isDownLg = useMediaQuery(theme.breakpoints.down('lg'));

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const renderNavLinks = () => (
    <Stack direction="row" spacing={2}>
      {NAV_LINKS.map((nav) => {
        if (nav.children) {
          return <NavMenu key={nav.title} navLink={nav} />;
        }

        if (nav.href) {
          return (
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
          );
        }

        return null;
      })}
    </Stack>
  );

  const renderMobileLinks = () => (
    <Box>
      {NAV_LINKS.map((nav) => {
        if (nav.children) {
          return <NavMobileMenu key={nav.title} navLink={nav} />;
        }

        if (nav.href) {
          return (
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
              <Typography color="primary" variant="body2" fontWeight={600}>
                {nav.title}
              </Typography>
            </Link>
          );
        }

        return null;
      })}
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
                to={PATHS.MAIN}
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

type NavMenuProps = {
  navLink: NavLink;
};

const NavMenu: FC<NavMenuProps> = ({ navLink }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Button
        id={`menu-${navLink.title}-trigger`}
        aria-controls={open ? `menu-${navLink.title}-trigger` : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        disableRipple
        sx={{
          '&:hover': {
            background: 'none',
          },
          padding: '6px 8px',
        }}
      >
        <Typography color="primary" variant="body2" fontWeight={600}>
          {navLink.title}
        </Typography>
      </Button>
      <Menu
        id={`menu-${navLink.title}`}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': `menu-${navLink.title}-trigger`,
        }}
      >
        {navLink.children?.map(
          (nav) =>
            nav.href && (
              <MenuItem key={nav.title} onClick={handleClose}>
                <Link
                  to={nav.href}
                  style={{ textDecoration: 'none', padding: '6px 8px' }}
                >
                  <Typography color="primary" variant="body2" fontWeight={600}>
                    {nav.title}
                  </Typography>
                </Link>
              </MenuItem>
            )
        )}
      </Menu>
    </Box>
  );
};

const NavMobileMenu: FC<NavMenuProps> = ({ navLink }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box>
      <Box
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          width: '100%',
          textAlign: 'left',
          padding: '20px 32px',
          borderBottom: '1px solid #E9EBFA',
        }}
      >
        <Typography color="primary" variant="body2" fontWeight={600}>
          {navLink.title} Test
        </Typography>
      </Box>
      <Box
        sx={{
          overflow: 'hidden',
          height: isOpen ? 65 * (navLink.children?.length || 0) : 0,
          transition: 'all .5s ease-in-out',
        }}
      >
        {navLink.children?.map(
          (nav) =>
            nav.href && (
              <Link
                key={nav.title}
                to={nav.href}
                style={{
                  textDecoration: 'none',
                  padding: '20px 64px',
                  borderBottom: '1px solid #E9EBFA',
                  display: 'block',
                }}
              >
                <Typography color="primary" variant="body2" fontWeight={400}>
                  {nav.title}
                </Typography>
              </Link>
            )
        )}
      </Box>
    </Box>
  );
};
