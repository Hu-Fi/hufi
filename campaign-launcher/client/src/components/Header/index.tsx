import { type FC, type MouseEvent, useCallback, useState } from 'react';

import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  IconButton,
  Link as MuiLink,
  Popover,
  Stack,
  type SxProps,
  Toolbar,
} from '@mui/material';
import { Link, useLocation } from 'react-router';
import { useConnection } from 'wagmi';

import logo from '@/assets/logo.svg';
import Account from '@/components/Account';
import ConnectWallet from '@/components/ConnectWallet';
import Container from '@/components/Container';
import { ROUTES } from '@/constants';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { OpenInNewIcon } from '@/icons';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';

type StyledLinkProps = {
  to: string;
  text: string;
  isActive?: boolean;
  isExternal?: boolean;
  sx?: SxProps;
  target?: string;
  onClick?: () => void;
};

const StyledLink = ({
  to,
  text,
  isActive,
  isExternal,
  sx,
  onClick,
}: StyledLinkProps) => {
  return (
    <MuiLink
      to={to}
      component={Link}
      target={isExternal ? '_blank' : undefined}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        width: { xs: 'fit-content', md: 'auto' },
        px: { xs: 0, md: 2 },
        py: { xs: 0, md: 1 },
        textDecoration: 'none',
        color: { xs: 'text.primary', md: isActive ? 'white' : '#6b6490' },
        fontWeight: 600,
        fontSize: '14px',
        bgcolor: isActive ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
        borderRadius: '10px',
        '&:hover': {
          color: 'white',
        },
        ...sx,
      }}
      onClick={onClick}
    >
      {text}
      {isExternal && <OpenInNewIcon />}
    </MuiLink>
  );
};

const DOCS_URL = import.meta.env.VITE_APP_DOCS_URL;
const STAKING_DASHBOARD_URL = import.meta.env.VITE_APP_STAKING_DASHBOARD_URL;

const Header: FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const { pathname } = useLocation();
  const { activeAddress } = useActiveAccount();
  const { isConnected } = useConnection();
  const isMobile = useIsMobile();

  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    },
    []
  );

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogoClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (pathname !== ROUTES.DASHBOARD) {
        return;
      }

      event.preventDefault();
      window.location.reload();
    },
    [pathname]
  );

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        bgcolor: 'background.default',
        boxShadow: 'none',
        width: '100%',
        borderBottom: '1px solid #433679',
        '& .MuiToolbar-root': {
          px: { xs: 2, md: 0 },
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
            height: { xs: '62px', md: '90px' },
            py: { xs: 1, md: 3 },
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              sx={{
                display: { xs: 'flex', md: 'none' },
                color: 'primary.main',
                p: 0,
              }}
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <MuiLink
              component={Link}
              to={ROUTES.DASHBOARD}
              sx={{ height: isMobile ? 23 : 32 }}
              onClick={handleLogoClick}
            >
              <img src={logo} alt="HuFi" width={isMobile ? 62 : 87} />
            </MuiLink>
          </Box>

          <Box
            display={{ xs: 'none', md: 'flex' }}
            alignItems="center"
            height="100%"
            mx="auto"
          >
            <StyledLink
              to={ROUTES.DASHBOARD}
              text="Dashboard"
              isActive={pathname === ROUTES.DASHBOARD}
            />
            <StyledLink
              to={ROUTES.CAMPAIGNS}
              text="Campaigns"
              isActive={pathname === ROUTES.CAMPAIGNS}
            />
            <StyledLink to={DOCS_URL} text="Support" isExternal />
            <StyledLink
              to={STAKING_DASHBOARD_URL}
              text="Stake HMT"
              isExternal
            />
          </Box>
          {activeAddress && isConnected ? (
            <Account />
          ) : (
            <ConnectWallet size={isMobile ? 'medium' : 'large'} />
          )}
        </Toolbar>

        <Popover
          open={!!anchorEl}
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          keepMounted
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          slotProps={{
            paper: {
              elevation: 10,
              square: true,
              sx: {
                top: '62px !important',
                left: '0 !important',
                bgcolor: 'background.default',
                maxWidth: '100%',
                width: '100%',
              },
            },
          }}
        >
          <Stack
            sx={{
              p: 2,
              pb: 4,
              gap: 3,
            }}
          >
            <StyledLink
              to={ROUTES.DASHBOARD}
              text="Dashboard"
              onClick={handleMenuClose}
            />
            <StyledLink
              to={ROUTES.CAMPAIGNS}
              text="Campaigns"
              onClick={handleMenuClose}
            />
            <StyledLink
              to={DOCS_URL}
              text="Support"
              isExternal
              onClick={handleMenuClose}
            />
            <StyledLink
              to={STAKING_DASHBOARD_URL}
              text="Stake HMT"
              isExternal
              onClick={handleMenuClose}
            />
          </Stack>
        </Popover>
      </Container>
    </AppBar>
  );
};

export default Header;
