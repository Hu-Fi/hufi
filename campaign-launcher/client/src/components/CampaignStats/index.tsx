import { Children, FC, PropsWithChildren, useState } from 'react';

import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { Box, IconButton, styled, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

import { useIsXlDesktop } from '../../hooks/useBreakpoints';
import { MiniChartIcon } from '../../icons';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';
import { CampaignDetails, CampaignStatus, CampaignType } from '../../types';
import {
  formatTokenAmount,
  getDailyTargetTokenSymbol,
  getTokenInfo,
} from '../../utils';
import CampaignResultsWidget, { StatusTooltip } from '../CampaignResultsWidget';
import CampaignSymbol from '../CampaignSymbol';
import CustomTooltip from '../CustomTooltip';
import FormattedNumber from '../FormattedNumber';
import InfoTooltipInner from '../InfoTooltipInner';
import ChartModal from '../modals/ChartModal';
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
    padding: '16px 24px 24px',
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
        <FlexGrid>{children}</FlexGrid>
      </Grid>
    );
  }

  return (
    <>
      {Children.map(children, (child) => (
        <Grid size={{ xs: 12, md: 3 }}>{child}</Grid>
      ))}
    </>
  );
};

const getDailyTargetCardLabel = (campaignType: CampaignType) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return 'Daily volume target';
    case CampaignType.HOLDING:
      return 'Daily balance target';
    default:
      return 'Daily volume target';
  }
}

const CampaignStats: FC<Props> = ({ campaign, isJoined }) => {
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const { exchangesMap } = useExchangesContext();
  const isXl = useIsXlDesktop();
  const { isAuthenticated } = useWeb3Auth();

  const showProgressWidget =
    isAuthenticated &&
    isJoined &&
    campaign?.status === CampaignStatus.ACTIVE &&
    now >= campaign?.start_date &&
    now <= campaign?.end_date;

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

  const targetToken = getDailyTargetTokenSymbol(campaign.type, campaign.symbol);
  const { label: targetTokenSymbol } = getTokenInfo(targetToken);

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
            <Title variant="subtitle2">
              {getDailyTargetCardLabel(campaign.type)}
            </Title>
            <Typography variant="h5" color="primary.violet" fontWeight={700}>
              <FormattedNumber
                value={campaign.details?.daily_volume_target}
                decimals={3}
              />{' '}
              <span>{targetTokenSymbol}</span>
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
              <UserProgressWidget campaign={campaign} />
            </Box>
          </Grid>
        )}
      </Grid>
      <Grid container spacing={2} width="100%" mt={-2}>
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
            <Title variant="subtitle2">Symbol</Title>
            <CampaignSymbol
              symbol={campaign.symbol}
              campaignType={campaign.type}
              size="medium"
            />
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
            <CampaignResultsWidget
              campaignStatus={campaign.status}
              finalResultsUrl={campaign.final_results_url}
              intermediateResultsUrl={campaign.intermediate_results_url}
            />
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard>
            <Title variant="subtitle2" display="flex" alignItems="center" justifyContent="space-between">
              Campaign chart
              <IconButton
                disableRipple
                sx={{
                  p: 0,
                  ml: 'auto',
                  '&:hover': { background: 'none' },
                }}
                onClick={() => setIsChartModalOpen(true)}
              >
                <ZoomOutMapIcon />
              </IconButton>
            </Title>
            <MiniChartIcon sx={{ width: '100%', height: 'auto' }} />
          </StatsCard>
        </Grid>
      </Grid>
      <ChartModal
        open={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        campaign={campaign}
      />
    </>
  );
};

export default CampaignStats;
