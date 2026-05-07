import type { FC } from 'react';

import { Box, Link as MuiLink, Paper, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router';

import { MOBILE_BOTTOM_NAV_HEIGHT, ROUTES } from '@/constants';
import {
  MobileBottomNavDashboardIcon,
  MobileBottomNavCampaignsIcon,
} from '@/icons';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: ROUTES.DASHBOARD,
    icon: MobileBottomNavDashboardIcon,
  },
  {
    label: 'Campaigns',
    to: ROUTES.CAMPAIGNS,
    icon: MobileBottomNavCampaignsIcon,
  },
] as const;

const MobileBottomNav: FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const { pathname } = useLocation();

  if (!isVisible) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        px: 0,
        pb: 0,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Paper
        elevation={0}
        square
        sx={{
          display: 'flex',
          width: '100%',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => {
          const isActive = pathname === to;
          return (
            <MuiLink
              key={to}
              component={Link}
              to={to}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                height: `${MOBILE_BOTTOM_NAV_HEIGHT}px`,
                color: isActive ? 'error.main' : 'text.primary',
                bgcolor: isActive ? '#251d47' : 'background.default',
                gap: 1,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                '&:first-of-type': {
                  borderTopRightRadius: '8px',
                },
                '&:last-of-type': {
                  borderTopLeftRadius: '8px',
                },
              }}
            >
              <Icon sx={{ fontSize: 36 }} />
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: '100%',
                }}
              >
                {label}
              </Typography>
            </MuiLink>
          );
        })}
      </Paper>
    </Box>
  );
};

export default MobileBottomNav;
