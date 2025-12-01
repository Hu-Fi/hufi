import { type FC, useCallback, useState } from 'react';

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
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useConnection } from 'wagmi';

import logo from '@/assets/logo.svg';
import Account from '@/components/Account';
import ConnectWallet from '@/components/ConnectWallet';
import Container from '@/components/Container';
import CustomTooltip from '@/components/CustomTooltip';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import LaunchCampaign from '@/components/LaunchCampaign';
import NetworkSwitcher from '@/components/NetworkSwitcher';
import { ROUTES } from '@/constants';
import { useIsMobile } from '@/hooks/useBreakpoints';
import useRetrieveSigner from '@/hooks/useRetrieveSigner';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';

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
      sx={{
        width: { xs: 'fit-content', md: 'auto' },
        textDecoration: 'none',
        color: 'primary.main',
        fontWeight: 600,
        fontSize: '14px',
        ...sx,
      }}
      onClick={onClick}
    >
      {text}
    </MuiLink>
  );
};

const DOCS_URL = import.meta.env.VITE_APP_DOCS_URL;
const STAKING_DASHBOARD_URL = import.meta.env.VITE_APP_STAKING_DASHBOARD_URL;
const LAUNCH_CAMPAIGN_TOOLTIP =
  "You'll need to connect your wallet before launching a campaign";

const Header: FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const { activeAddress } = useActiveAccount();
  const { isConnected } = useConnection();
  const { signer } = useRetrieveSigner();
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

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        position: { xs: 'sticky', sm: 'static' },
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        bgcolor: 'background.default',
        boxShadow: 'none',
        width: '100%',
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
            <Link to={ROUTES.DASHBOARD}>
              <img
                src={logo}
                alt="HuFi"
                width={isMobile ? 60 : 87}
                height={isMobile ? 22 : 32}
              />
            </Link>
          </Box>

          <Box
            display={{ xs: 'none', md: 'flex' }}
            gap={2}
            alignItems="center"
            height="100%"
          >
            <StyledLink to={DOCS_URL} text="Support" target="_blank" />
            <StyledLink to={ROUTES.DASHBOARD} text="Dashboard" />
            <StyledLink
              to={STAKING_DASHBOARD_URL}
              text="Stake HMT"
              target="_blank"
            />
            <NetworkSwitcher />
            <LaunchCampaign variant="outlined" withTooltip />
            {activeAddress && isConnected ? <Account /> : <ConnectWallet />}
          </Box>

          <Box display={{ xs: 'flex', md: 'none' }}>
            {activeAddress && isConnected ? <Account /> : <ConnectWallet />}
          </Box>
        </Toolbar>

        <Popover
          open={!!anchorEl}
          anchorEl={anchorEl}
          onClose={handleMenuClose}
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
              to={DOCS_URL}
              text="Support"
              onClick={handleMenuClose}
            />
            <StyledLink
              to={ROUTES.DASHBOARD}
              text="Dashboard"
              onClick={handleMenuClose}
            />
            <StyledLink
              to={STAKING_DASHBOARD_URL}
              text="Stake HMT"
              target="_blank"
              onClick={handleMenuClose}
            />
            <NetworkSwitcher />
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              width="100%"
              sx={{ '& button': { flex: 1 } }}
            >
              <LaunchCampaign variant={signer ? 'outlined' : 'contained'} />
              {!signer && (
                <CustomTooltip
                  title={
                    <Typography variant="tooltip">
                      {LAUNCH_CAMPAIGN_TOOLTIP}
                    </Typography>
                  }
                  slotProps={{
                    tooltip: {
                      sx: {
                        width: '150px',
                        lineHeight: '14px',
                      },
                    },
                  }}
                  arrow
                  placement="left"
                >
                  <InfoTooltipInner />
                </CustomTooltip>
              )}
            </Box>
          </Stack>
        </Popover>
      </Container>
    </AppBar>
  );
};

export default Header;
