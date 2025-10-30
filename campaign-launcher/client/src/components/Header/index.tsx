import { type FC, useState } from 'react';

import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Collapse,
  IconButton,
  Link as MuiLink,
  Paper,
  type SxProps,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

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

const STAKING_DASHBOARD_URL = import.meta.env.VITE_APP_STAKING_DASHBOARD_URL;

const Header: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { activeAddress } = useActiveAccount();
  const { isConnected } = useAccount();
  const isMobile = useIsMobile();
  const { signer } = useRetrieveSigner();

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
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
          <Link to={ROUTES.DASHBOARD}>
            <img
              src={logo}
              alt="HuFi"
              width={isMobile ? 60 : 87}
              height={isMobile ? 22 : 32}
            />
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
            {activeAddress && isConnected ? <Account /> : <ConnectWallet />}
          </Box>

          <Box display={{ xs: 'flex', md: 'none' }} gap={2} alignItems="center">
            {activeAddress && isConnected ? <Account /> : <ConnectWallet />}
            <IconButton
              edge="start"
              sx={{
                display: { xs: 'flex', md: 'none' },
                color: 'primary.main',
              }}
              onClick={toggleMenu}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>

        <Collapse in={isMenuOpen} timeout="auto">
          <Paper
            elevation={10}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default',
              borderRadius: '0',
              boxShadow: 'none',
              p: 2,
              pb: 4,
              gap: 3,
            }}
          >
            <StyledLink
              to={ROUTES.SUPPORT}
              text="Support"
              onClick={() => setIsMenuOpen(false)}
            />
            <StyledLink
              to={ROUTES.DASHBOARD}
              text="Dashboard"
              onClick={() => setIsMenuOpen(false)}
            />
            <StyledLink
              to={STAKING_DASHBOARD_URL}
              text="Stake HMT"
              target="_blank"
              onClick={() => setIsMenuOpen(false)}
            />
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
                      You&apos;ll need to connect your wallet before launching a
                      campaign
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
          </Paper>
        </Collapse>
      </Container>
    </AppBar>
  );
};

export default Header;
