import { FC } from 'react';

import { Box, styled, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

import useGetLiquidityScore from '../../hooks/useGetLiquidityScore';

const StatsCard = styled(Box)(({ theme }) => ({
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
  }
}));

const Value = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.violet,
  fontSize: '40px',
  fontWeight: 800,
  letterSpacing: '-0.5px',
  lineHeight: '100%',
}));

const DashboardStats: FC = () => {
  const { data: liquidityScore } = useGetLiquidityScore();

  return (
    <Box component="section" display="flex" flexWrap="wrap">
      <Grid container spacing={2} justifyContent="center" width="100%">
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard>
            <Typography variant="subtitle2">Rewards Pool</Typography>
            <Value>$0</Value>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard>
            <Typography variant="subtitle2">Total Liquidity Provided</Typography>
            <Value>${(liquidityScore as { total: number })?.total || 0}</Value>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard>
            <Typography variant="subtitle2">Number of Active Campaigns</Typography>
            <Value>0</Value>
          </StatsCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardStats;
