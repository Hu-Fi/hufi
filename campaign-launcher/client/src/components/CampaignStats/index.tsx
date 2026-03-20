import { type FC } from 'react';

import { Box, Skeleton, styled, Typography, Grid } from '@mui/material';

import CampaignResultsWidget from '@/components/CampaignResultsWidget';
import FormattedNumber from '@/components/FormattedNumber';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useCampaignTimeline } from '@/hooks/useCampaignTimeline';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import { CampaignStatus, type CampaignDetails } from '@/types';
import {
  formatTokenAmount,
  getDailyTargetTokenSymbol,
  getTargetInfo,
  getTokenInfo,
} from '@/utils';

type Props = {
  campaign: CampaignDetails | null | undefined;
  isJoined: boolean;
  isCampaignLoading: boolean;
};

const StatsCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'start',
  height: '175px',
  padding: '32px',
  gap: '45px',
  backgroundColor: '#251D47',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',

  [theme.breakpoints.down('md')]: {
    flexDirection: 'column-reverse',
    height: '100px',
    padding: '12px',
    gap: '16px',
    borderRadius: '8px',
  },
}));

const CardName = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '16px',
  fontWeight: 600,
  lineHeight: '18px',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',

  [theme.breakpoints.down('md')]: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '150%',
    letterSpacing: '0px',
    textTransform: 'none',
  },
}));

const CardValue = styled(Typography)(({ theme }) => ({
  color: 'white',
  fontSize: '36px',
  fontWeight: 800,
  lineHeight: '100%',

  [theme.breakpoints.down('md')]: {
    fontSize: '20px',
    fontWeight: 500,
    lineHeight: '150%',
  },
}));

const now = new Date().toISOString();

const renderSkeletonBlocks = (isMobile: boolean) => {
  const elements = Array(6).fill(0);
  return (
    <Grid container spacing={{ xs: 2, md: 3 }} width="100%">
      {elements.map((_, index) => (
        <Grid size={{ xs: 6, md: 4 }} key={`first-${index}`}>
          <StatsCard>
            <Skeleton variant="text" width="100%" height={isMobile ? 21 : 18} />
            <Skeleton variant="text" width="100%" height={isMobile ? 30 : 36} />
          </StatsCard>
        </Grid>
      ))}
    </Grid>
  );
};

const CampaignStats: FC<Props> = ({
  campaign,
  isJoined,
  isCampaignLoading,
}) => {
  const { exchangesMap } = useExchangesContext();
  const isMobile = useIsMobile();
  const { isAuthenticated } = useWeb3Auth();
  const campaignTimeline = useCampaignTimeline(campaign);

  if (isCampaignLoading) return renderSkeletonBlocks(isMobile);

  if (!campaign) return null;

  const isOngoingCampaign =
    campaign.status === CampaignStatus.ACTIVE &&
    now >= campaign.start_date &&
    now <= campaign.end_date;

  const hasProgressBeforeCancel =
    campaign.status === CampaignStatus.TO_CANCEL &&
    campaign.reserved_funds !== campaign.balance;

  const showUserPerformance =
    isAuthenticated &&
    isJoined &&
    (isOngoingCampaign || hasProgressBeforeCancel);

  const exchangeName =
    exchangesMap.get(campaign.exchange_name)?.display_name ||
    campaign.exchange_name;

  const formattedTokenAmount = +formatTokenAmount(
    campaign.fund_amount,
    campaign.fund_token_decimals
  );

  const targetInfo = getTargetInfo(campaign);

  const targetToken = getDailyTargetTokenSymbol(campaign.type, campaign.symbol);
  const { label: targetTokenSymbol } = getTokenInfo(targetToken);

  return (
    <Grid container spacing={{ xs: 2, md: 3 }} width="100%">
      <Grid size={{ xs: 6, md: 4 }}>
        <StatsCard>
          <CardName variant="subtitle2">
            {isMobile ? 'Reward Pool' : 'Total Reward Pool'}
          </CardName>
          <CardValue>
            {formattedTokenAmount} {campaign.fund_token_symbol}
          </CardValue>
        </StatsCard>
      </Grid>
      <Grid size={{ xs: 6, md: 4 }}>
        <StatsCard>
          <CardName variant="subtitle2">{targetInfo.label}</CardName>
          <CardValue>
            <FormattedNumber
              value={targetInfo.value}
              decimals={3}
              suffix={` ${targetTokenSymbol}`}
            />
          </CardValue>
        </StatsCard>
      </Grid>
      <Grid size={{ xs: 6, md: 4 }}>
        <StatsCard>
          <CardName>Exchange</CardName>
          <CardValue>{exchangeName}</CardValue>
        </StatsCard>
      </Grid>
      {showUserPerformance && (
        <>
          <Grid size={{ xs: 6, md: 4 }}>
            <StatsCard>
              <CardName variant="subtitle2">Ranking</CardName>
              <CardValue>14 / 81</CardValue>
            </StatsCard>
          </Grid>
          <Grid size={{ xs: 6, md: 4 }}>
            <StatsCard>
              <CardName variant="subtitle2">My Volume</CardName>
              <CardValue>
                {formattedTokenAmount} {campaign.fund_token_symbol}
              </CardValue>
            </StatsCard>
          </Grid>
        </>
      )}
      <Grid size={{ xs: 6, md: 4 }}>
        <CampaignResultsWidget
          campaignStatus={campaign.status}
          finalResultsUrl={campaign.final_results_url}
          intermediateResultsUrl={campaign.intermediate_results_url}
        />
      </Grid>
      <Grid size={{ xs: 6, md: 4 }}>
        <StatsCard>
          <CardName>{campaignTimeline.label}</CardName>
          <CardValue>{campaignTimeline.value}</CardValue>
        </StatsCard>
      </Grid>
    </Grid>
  );
};

export default CampaignStats;
