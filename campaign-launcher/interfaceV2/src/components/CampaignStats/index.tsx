import { FC } from 'react';

import { Box, styled, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { formatEther } from 'ethers';

import { CampaignDataDto } from '../../api/client';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { CryptoPairEntity } from '../CryptoPairEntity';
import DailyAmountPaidChart from '../DailyAmountPaidChart';

type Props = {
  campaign: CampaignDataDto | undefined;
};

const StatsCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '216px',
  padding: '16px 32px',
  backgroundColor: theme.palette.background.default,
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginBottom: '56px',
}));

const Value = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.violet,
  fontSize: '40px',
  fontWeight: 800,
  letterSpacing: '-0.5px',
  lineHeight: '100%',

  '& > span': {
    fontSize: '30px',
  },
}));

const InfoTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginBottom: '32px',
}));

const FlexGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  width: '100%',
  '& > *': {
    flexBasis: 'calc(50% - 8px)',
  },

  [theme.breakpoints.down('md')]: {
    '& > *': {
      flexBasis: '100%',
    },
  },
}));

const CampaignStats: FC<Props> = ({ campaign }) => {
  const { exchanges } = useExchangesContext();
  const exchange = exchanges?.find(
    (exchange) => exchange.name === campaign?.exchangeName
  );
  const exchangeName = exchange?.displayName;
  const exchangeLogo = exchange?.logo;

  if (!campaign) {
    return null;
  }

  return (
    <Grid container spacing={2} width="100%">
      <Grid size={{ xs: 12, md: 6 }}>
        <FlexGrid>
          <StatsCard>
            <Title variant="subtitle2">Total Funded Amount</Title>
            <Value>
              {formatEther(campaign.totalFundedAmount)} <span>HMT</span>
            </Value>
          </StatsCard>
          <StatsCard>
            <Title variant="subtitle2">Amount Paid</Title>
            <Value>
              {formatEther(campaign.amountPaid)} <span>HMT</span>
            </Value>
          </StatsCard>
          <StatsCard>
            <InfoTitle variant="subtitle2">Exchange</InfoTitle>
            <Box display="flex" alignItems="center" gap={2} height="72px">
              <img
                src={exchangeLogo}
                alt={exchangeName}
                width="100px"
                height="40px"
              />
              <Typography
                color="primary"
                fontSize="30px"
                fontWeight={800}
                letterSpacing="-0.5px"
                lineHeight="100%"
                maxWidth="140px"
              >
                {exchangeName}
              </Typography>
            </Box>
          </StatsCard>
          <StatsCard>
            <InfoTitle variant="subtitle2">Pair</InfoTitle>
            <CryptoPairEntity symbol={campaign.symbol} size="large" />
          </StatsCard>
        </FlexGrid>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          flexDirection={{ xs: 'column', md: 'row' }}
          bgcolor="background.default"
          borderRadius="16px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          height="100%"
          p={2}
        >
          <Box display="flex" flexDirection="column">
            <Title variant="subtitle2" sx={{ mb: 1 }}>
              Daily amounts paid (24h)
            </Title>
            <Typography
              color="primary.violet"
              fontSize="80px"
              fontWeight={800}
              lineHeight={7 / 6}
            >
              0
            </Typography>
          </Box>
          <DailyAmountPaidChart />
        </Box>
      </Grid>
    </Grid>
  );
};

export default CampaignStats;
