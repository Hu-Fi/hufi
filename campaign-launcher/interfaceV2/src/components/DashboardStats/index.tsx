import { FC } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { Box, styled, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useAccount } from 'wagmi';

import { useCampaignsStats } from '../../hooks/useCampaigns';

const StatsCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: '144px',
  backgroundColor: theme.palette.background.default,
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '16px 24px',
}));

const Value = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.violet,
  fontSize: '40px',
  fontWeight: 800,
  letterSpacing: '-0.5px',
  lineHeight: '100%',
}));

const DashboardStats: FC = () => {
  const { chain } = useAccount();
  const { data: campaignsStats } = useCampaignsStats(chain?.id as ChainId);

  return (
    <Box component="section" display="flex" flexWrap="wrap">
      <Grid container spacing={2} justifyContent="center" width="100%">
        <Grid size={4}>
          <StatsCard>
            <Typography variant="subtitle2">Rewards Pool</Typography>
            <Value>${campaignsStats?.totalFundsUSD}</Value>
          </StatsCard>
        </Grid>
        <Grid size={4}>
          <StatsCard>
            <Typography variant="subtitle2">Total Liquidity Provided</Typography>
            <Value>$7,372,989</Value>
          </StatsCard>
        </Grid>
        <Grid size={4}>
          <StatsCard>
            <Typography variant="subtitle2">Number of Active Campaigns</Typography>
            <Value>{campaignsStats?.totalCampaigns}</Value>
          </StatsCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardStats;
