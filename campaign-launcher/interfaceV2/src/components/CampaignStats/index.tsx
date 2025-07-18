import { FC } from 'react';

import { Box, styled, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

import { CampaignDataDto } from '../../api/client';
import { useIsXlDesktop } from '../../hooks/useBreakpoints';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { formatTokenAmount } from '../../utils';
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

  [theme.breakpoints.down('xl')]: {
    height: '125px',
    padding: '16px 32px 24px',
  },

  [theme.breakpoints.only('md')]: {
    height: '125px',
    padding: '12px',
  },
}));

const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginBottom: '56px',

  [theme.breakpoints.down('xl')]: {
    marginBottom: '16px',
  },
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

const FlexGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  width: '100%',
  '& > *': {
    flexBasis: 'calc(50% - 8px)',
  },

  [theme.breakpoints.only('md')]: {
    gap: '8px',
  },

  [theme.breakpoints.down('md')]: {
    '& > *': {
      flexBasis: '100%',
    },
  },
}));

const CampaignStats: FC<Props> = ({ campaign }) => {
  const { exchanges } = useExchangesContext();
  const isXl = useIsXlDesktop();

  const exchange = exchanges?.find(
    (exchange) => exchange.name === campaign?.exchangeName
  );
  const exchangeName = exchange?.displayName;

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
              {formatTokenAmount(campaign.totalFundedAmount, campaign.tokenDecimals)} <span>{campaign.tokenSymbol}</span>
            </Value>
          </StatsCard>
          <StatsCard>
            <Title variant="subtitle2">Amount Paid</Title>
            <Value>
              {formatTokenAmount(campaign.amountPaid, campaign.tokenDecimals)} <span>{campaign.tokenSymbol}</span>
            </Value>
          </StatsCard>
          <StatsCard>
            <Title variant="subtitle2">Exchange</Title>
            <Typography variant={isXl ? 'h4' : 'h6-mobile'}>
              {exchangeName}
            </Typography>
          </StatsCard>
          <StatsCard>
            <Title variant="subtitle2">Pair</Title>
            <CryptoPairEntity
              symbol={campaign.symbol}
              size={isXl ? 'large' : 'medium'}
            />
          </StatsCard>
        </FlexGrid>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          bgcolor="background.default"
          borderRadius="16px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          height="100%"
          p={2}
        >
          <DailyAmountPaidChart data={campaign.dailyAmountPaid} endDate={campaign.endBlock} tokenSymbol={campaign.tokenSymbol} />
        </Box>
      </Grid>
    </Grid>
  );
};

export default CampaignStats;
