import { FC } from 'react';

import { Box, styled, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

import { useIsXlDesktop } from '../../hooks/useBreakpoints';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { CampaignDetails } from '../../types';
import { formatTokenAmount } from '../../utils';
import { CryptoPairEntity } from '../CryptoPairEntity';
import DailyAmountPaidChart from '../DailyAmountPaidChart';
import FormattedNumber from '../FormattedNumber';

type Props = {
  campaign: CampaignDetails | null | undefined;
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
  const { exchangesMap } = useExchangesContext();
  const isXl = useIsXlDesktop();

  if (!campaign) return null;

  const exchangeName = exchangesMap.get(campaign.exchange_name)?.display_name || campaign.exchange_name;

  const totalFee = campaign.exchange_oracle_fee_percent + campaign.recording_oracle_fee_percent + campaign.reputation_oracle_fee_percent;
  const formattedTokenAmount = +formatTokenAmount(campaign.fund_amount, campaign.fund_token_decimals);

  return (
    <Grid container spacing={2} width="100%">
      <Grid size={{ xs: 12, md: 6 }}>
        <FlexGrid>
          <StatsCard>
            <Typography variant="subtitle2" mb={{ xs: 2, xl: 7 }}>Total Funded Amount</Typography>
            <Value>
              {formattedTokenAmount} <span>{campaign.fund_token_symbol}</span>
            </Value>
          </StatsCard>
          <StatsCard>
            <Typography variant="subtitle2" mb={{ xs: 2, xl: 7 }}>Amount Paid</Typography>
            <Value>
              {formatTokenAmount(campaign.amount_paid, campaign.fund_token_decimals)} <span>{campaign.fund_token_symbol}</span>
            </Value>
          </StatsCard>
          <StatsCard>
            <Typography variant="subtitle2" mb={{ xs: 2, xl: 7 }}>Exchange</Typography>
            <Typography variant={isXl ? 'h4' : 'h6-mobile'}>
              {exchangeName}
            </Typography>
          </StatsCard>
          <StatsCard>
            <Typography variant="subtitle2" mb={{ xs: 2, xl: 7 }}>Pair</Typography>
            <CryptoPairEntity
              symbol={campaign.trading_pair}
              size={isXl ? 'large' : 'medium'}
            />
          </StatsCard>
          <StatsCard 
            sx={{ 
              flexDirection: { xs: 'column', md: 'row' }, 
              gap: 2,
              alignItems: { xs: 'flex-start', md: 'center' }, 
              py: { xs: 1.5, md: 2 }, 
              height: { xs: 'unset' }, 
              flexBasis: '100%'
            }}
          >
            <Typography variant="subtitle2">Oracle fees</Typography>
            <Typography variant="h6" color="primary.violet" fontWeight={700}>
              <FormattedNumber value={formattedTokenAmount * totalFee / 100} suffix={' ' + campaign.fund_token_symbol} />
              ({totalFee}%)
            </Typography>
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
          <DailyAmountPaidChart data={campaign.daily_paid_amounts} endDate={campaign.end_date} tokenSymbol={campaign.fund_token_symbol} />
        </Box>
      </Grid>
    </Grid>
  );
};

export default CampaignStats;
