import { Children, FC, PropsWithChildren } from 'react';

import { Box, styled, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

import { useGetUserProgress } from '../../hooks/recording-oracle';
import { useIsXlDesktop } from '../../hooks/useBreakpoints';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';
import { CampaignDetails } from '../../types';
import { formatTokenAmount } from '../../utils';
import CampaignResultsWidget, { StatusTooltip } from '../CampaignResultsWidget';
import { CryptoPairEntity } from '../CryptoPairEntity';
import CustomTooltip from '../CustomTooltip';
import FormattedNumber from '../FormattedNumber';
import InfoTooltipInner from '../InfoTooltipInner';
import UserProgressWidget from '../UserProgressWidget';

type Props = {
  campaign: CampaignDetails | null | undefined;
  isJoined: boolean;
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
    height: 'unset',
    minHeight: '125px',
    justifyContent: 'space-between',
    padding: '16px 32px 24px',
  },

  [theme.breakpoints.only('md')]: {
    height: 'unset',
    minHeight: '125px',
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

const now = new Date().toISOString();

const FirstRowWrapper: FC<PropsWithChildren<{ showProgressWidget: boolean }>> = ({ showProgressWidget, children }) => {
  if (showProgressWidget) {
    return (
      <Grid size={{ xs: 12, md: 6 }}>
        <FlexGrid>
          {children}
        </FlexGrid>
      </Grid>
    );
  }

  return (
    <>
      {Children.map(children, (child) => (
        <Grid size={{ xs: 12, md: 3 }}>
          {child}
        </Grid>
      ))}
    </>
  );
}

const CampaignStats: FC<Props> = ({ campaign, isJoined }) => {
  const { exchangesMap } = useExchangesContext();
  const isXl = useIsXlDesktop();
  const { isAuthenticated } = useWeb3Auth();

  const showProgressWidget = isAuthenticated && isJoined && campaign?.status === 'active' && now >= campaign?.start_date && now <= campaign?.end_date;

  const { data: userProgress, isLoading: isUserProgressLoading } = useGetUserProgress(campaign?.address, showProgressWidget);

  if (!campaign) return null;

  const exchangeName =
    exchangesMap.get(campaign.exchange_name)?.display_name ||
    campaign.exchange_name;
  const totalFee =
    campaign.exchange_oracle_fee_percent +
    campaign.recording_oracle_fee_percent +
    campaign.reputation_oracle_fee_percent;
  const formattedTokenAmount = +formatTokenAmount(
    campaign.fund_amount,
    campaign.fund_token_decimals
  );
  const formattedAmountPaid = +formatTokenAmount(
    campaign.amount_paid,
    campaign.fund_token_decimals
  );

  return (
    <>
      <Grid container spacing={2} width="100%">
        <FirstRowWrapper showProgressWidget={showProgressWidget}>
          <StatsCard>
            <Title variant="subtitle2">Total Funded Amount</Title>
            <Typography variant="h5" color="primary.violet" fontWeight={700}>
              {formattedTokenAmount}{' '}{campaign.fund_token_symbol}
            </Typography>
          </StatsCard>
          <StatsCard>
            <Title variant="subtitle2">Amount Paid</Title>
            <Typography variant="h5" color="primary.violet" fontWeight={700}>
              {formattedAmountPaid}{' '}{campaign.fund_token_symbol}
            </Typography>
          </StatsCard>
          <StatsCard>
            <Title variant="subtitle2">Oracle fees</Title>
            <Typography variant="h5" color="primary.violet" fontWeight={700}>
              <FormattedNumber value={(formattedTokenAmount * totalFee) / 100} />{' '}
              {campaign.fund_token_symbol}{' '}
              <Typography
                variant="h6"
                fontWeight={700}
                component="span"
                color="rgba(255, 255, 255, 0.18)"
              >
                ({totalFee}%)
              </Typography>
            </Typography>
          </StatsCard>
          <StatsCard>
            <Title variant="subtitle2">Daily volume target</Title>
            <Typography variant="h5" color="primary.violet" fontWeight={700}>
              <FormattedNumber
                value={campaign.daily_volume_target}
                decimals={3}
              />{' '}
              <span>{campaign.trading_pair.split('/')[1]}</span>
            </Typography>
          </StatsCard>  
        </FirstRowWrapper>
        {showProgressWidget && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              display="flex"
              py={2}
              px={3}
              bgcolor="background.default"
              borderRadius="16px"
              border="1px solid rgba(255, 255, 255, 0.1)"
              height="100%"
            >
              <UserProgressWidget data={userProgress} loading={isUserProgressLoading} />
            </Box>
          </Grid>
        )}
      </Grid>
      <Grid container spacing={2} width="100%">
        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard>
            <Title variant="subtitle2">Reserved funds</Title>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard>
            <Title variant="subtitle2" display="flex" alignItems="center" justifyContent="space-between">
              Campaign results
              <CustomTooltip title={<StatusTooltip />} arrow placement="top">
                <InfoTooltipInner />
              </CustomTooltip>
            </Title>
            <CampaignResultsWidget finalResultsUrl={campaign.final_results_url} intermediateResultsUrl={campaign.intermediate_results_url} />
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard>
            <Title variant="subtitle2">Exchange</Title>
            <Typography variant={isXl ? 'h4' : 'h6-mobile'}>
              {exchangeName}
            </Typography>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard>
            <Title variant="subtitle2">Pair</Title>
            <CryptoPairEntity
              symbol={campaign.trading_pair}
              size={isXl ? 'large' : 'medium'}
            />
          </StatsCard>
        </Grid>
      </Grid>
    </>
  );
};

export default CampaignStats;
