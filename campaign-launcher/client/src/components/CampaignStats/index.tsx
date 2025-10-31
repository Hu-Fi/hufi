import { type FC, type PropsWithChildren, Children, useState } from 'react';

import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { Box, IconButton, styled, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

import CampaignResultsWidget, {
  StatusTooltip,
} from '@/components/CampaignResultsWidget';
import CampaignSymbol from '@/components/CampaignSymbol';
import CustomTooltip from '@/components/CustomTooltip';
import FormattedNumber from '@/components/FormattedNumber';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import ChartModal from '@/components/modals/ChartModal';
import UserProgressWidget from '@/components/UserProgressWidget';
import { useIsMobile, useIsXlDesktop } from '@/hooks/useBreakpoints';
import { MiniChartIcon } from '@/icons';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import { CampaignStatus, CampaignType, type CampaignDetails } from '@/types';
import {
  formatTokenAmount,
  getDailyTargetTokenSymbol,
  getTokenInfo,
} from '@/utils';

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
    padding: '16px',
  },

  [theme.breakpoints.down('md')]: {
    height: 'unset',
    minHeight: '125px',
  },
}));

const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginBottom: '56px',
  textTransform: 'capitalize',

  [theme.breakpoints.down('xl')]: {
    marginBottom: '16px',
  },

  [theme.breakpoints.down('md')]: {
    marginBottom: 'auto',
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

  [theme.breakpoints.down('md')]: {
    gap: '8px',
  },
}));

const now = new Date().toISOString();

const FirstRowWrapper: FC<
  PropsWithChildren<{
    showProgressWidget: boolean;
  }>
> = ({ showProgressWidget, children }) => {
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
        <Grid size={{ xs: 6, md: 3 }}>{child}</Grid>
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
      return campaignType as never;
  }
};

const getDailyTargetValue = (campaign: CampaignDetails) => {
  switch (campaign.type) {
    case CampaignType.MARKET_MAKING:
      return campaign.details.daily_volume_target;
    case CampaignType.HOLDING:
      return campaign.details.daily_balance_target;
    default:
      return 0;
  }
};

const renderProgressWidget = (campaign: CampaignDetails) => (
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
);

const CampaignStats: FC<Props> = ({ campaign, isJoined }) => {
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const { exchangesMap } = useExchangesContext();
  const isXl = useIsXlDesktop();
  const isMobile = useIsMobile();
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
      <Grid container spacing={{ xs: 1, md: 2 }} width="100%">
        {showProgressWidget && isMobile && renderProgressWidget(campaign)}
        <FirstRowWrapper showProgressWidget={showProgressWidget}>
          <StatsCard>
            <Title variant="subtitle2">Total Funded Amount</Title>
            <Typography
              variant={isMobile ? 'h6-mobile' : 'h5'}
              color="primary.violet"
              fontWeight={700}
              lineHeight={isMobile ? '1.5rem' : '2.25rem'}
            >
              {formattedTokenAmount} {campaign.fund_token_symbol}
            </Typography>
          </StatsCard>
          <StatsCard>
            <Title variant="subtitle2">Amount Paid</Title>
            <Typography
              variant={isMobile ? 'h6-mobile' : 'h5'}
              color="primary.violet"
              fontWeight={700}
              lineHeight={isMobile ? '1.5rem' : '2.25rem'}
            >
              {formattedAmountPaid} {campaign.fund_token_symbol}
            </Typography>
          </StatsCard>
          <StatsCard>
            <Title variant="subtitle2">Oracle fees</Title>
            <Typography
              variant={isMobile ? 'h6-mobile' : 'h5'}
              color="primary.violet"
              fontWeight={700}
              lineHeight={isMobile ? '1.5rem' : '2.25rem'}
            >
              <FormattedNumber
                value={(formattedTokenAmount * totalFee) / 100}
              />{' '}
              {campaign.fund_token_symbol}{' '}
              <Typography
                variant={isMobile ? 'body1' : 'h6'}
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
            <Typography
              variant={isMobile ? 'h6-mobile' : 'h5'}
              color="primary.violet"
              fontWeight={700}
              lineHeight={isMobile ? '1.5rem' : '2.25rem'}
            >
              <FormattedNumber
                value={getDailyTargetValue(campaign)}
                decimals={3}
              />{' '}
              <span>{targetTokenSymbol}</span>
            </Typography>
          </StatsCard>
        </FirstRowWrapper>
        {showProgressWidget && !isMobile && renderProgressWidget(campaign)}
      </Grid>
      <Grid container spacing={{ xs: 1, md: 2 }} width="100%" mt={-2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatsCard>
            <Title variant="subtitle2">Exchange</Title>
            <Typography
              variant={isXl ? 'h4' : isMobile ? 'body2' : 'h6-mobile'}
              fontWeight={isXl ? 600 : isMobile ? 700 : 500}
            >
              {exchangeName}
            </Typography>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatsCard sx={{ '&:last-child p': { fontWeight: 700 } }}>
            <Title variant="subtitle2">Symbol</Title>
            <CampaignSymbol
              symbol={campaign.symbol}
              campaignType={campaign.type}
              size={isXl ? 'large' : isMobile ? 'small' : 'medium'}
            />
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatsCard>
            <Title
              variant="subtitle2"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap={1}
            >
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
        <Grid size={{ xs: 6, md: 3 }}>
          <StatsCard>
            <Title
              variant="subtitle2"
              display="flex"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
            >
              Campaign chart
              <IconButton
                disableRipple
                sx={{
                  p: 0,
                  ml: { xs: 2, md: 'auto' },
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
