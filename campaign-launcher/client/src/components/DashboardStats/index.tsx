import type { FC } from 'react';

import { Box, Skeleton, styled, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

import FormattedNumber from '@/components/FormattedNumber';
import TotalVolume from '@/components/TotalVolume';
import { useGetCampaignsStats } from '@/hooks/useCampaigns';

export const StatsCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: '144px',
  backgroundColor: theme.palette.background.default,
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '16px 24px',

  [theme.breakpoints.down('xl')]: {
    height: '112px',
  },
}));

export const Value = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.violet,
  fontSize: '40px',
  fontWeight: 800,
  letterSpacing: '-0.5px',
  lineHeight: '100%',
}));

const DashboardStats: FC = () => {
  const { data: campaignsStats, isLoading } = useGetCampaignsStats();

  return (
    <Box component="section" display="flex" flexWrap="wrap">
      <Grid container spacing={2} justifyContent="center" width="100%">
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard>
            <Typography variant="subtitle2">Rewards Pool</Typography>
            <Value>
              {isLoading ? (
                <Skeleton variant="text" sx={{ fontSize: '40px' }} />
              ) : (
                <FormattedNumber
                  value={campaignsStats?.rewards_pool_usd}
                  prefix="$"
                />
              )}
            </Value>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TotalVolume />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard>
            <Typography variant="subtitle2">
              Number of Active Campaigns
            </Typography>
            <Value>
              {isLoading ? (
                <Skeleton variant="text" sx={{ fontSize: '40px' }} />
              ) : (
                <FormattedNumber value={campaignsStats?.n_active_campaigns} />
              )}
            </Value>
          </StatsCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardStats;
