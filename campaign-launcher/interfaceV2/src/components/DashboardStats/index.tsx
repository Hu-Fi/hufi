import { FC } from 'react';

import { Box, styled, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

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

const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

const Value = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.violet,
  fontSize: '40px',
  fontWeight: 800,
  letterSpacing: '-0.5px',
  lineHeight: '100%',
}));

const Info = styled(Box)(({ theme }) => ({
  background:
    'linear-gradient(13deg, rgba(247, 248, 253, 0.05) 20.33%, rgba(255, 255, 255, 0.05) 48.75%)',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const DashboardStats: FC = () => {
  return (
    <Box component="section" display="flex" flexWrap="wrap">
      <Grid container spacing={2} justifyContent="center" width="100%">
        <Grid size={3}>
          <StatsCard>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Title variant="subtitle2">Rewards Pool</Title>
              <Info>i</Info>
            </Box>
            <Value>$7,372</Value>
          </StatsCard>
        </Grid>
        <Grid size={3}>
          <StatsCard>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Title variant="subtitle2">Total Liquidity Provided</Title>
              <Info>i</Info>
            </Box>
            <Value>$7,372,989</Value>
          </StatsCard>
        </Grid>
        <Grid size={3}>
          <StatsCard>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Title variant="subtitle2">Volume Traded</Title>
              <Info>i</Info>
            </Box>
            <Value>$372,989</Value>
          </StatsCard>
        </Grid>
        <Grid size={3}>
          <StatsCard>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Title variant="subtitle2">Number of Active Campaigns</Title>
              <Info>i</Info>
            </Box>
            <Value>381</Value>
          </StatsCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardStats;
