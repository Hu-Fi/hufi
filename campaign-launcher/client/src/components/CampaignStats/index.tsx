import { type FC, type PropsWithChildren, Children } from 'react';

import { Box, Skeleton, styled, Typography, Grid } from '@mui/material';

import CampaignResultsWidget from '@/components/CampaignResultsWidget';
import FormattedNumber from '@/components/FormattedNumber';
import { useIsMobile } from '@/hooks/useBreakpoints';
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
  justifyContent: 'space-between',
  height: '175px',
  padding: '28px 32px',
  backgroundColor: '#251D47',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',

  [theme.breakpoints.down('md')]: {
    flexDirection: 'column-reverse',
    height: '100px',
    padding: '12px 16px 16px',
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
  marginBottom: '45px',

  [theme.breakpoints.down('md')]: {
    fontSize: '14px',
    lineHeight: '150%',
    letterSpacing: '0px',
    marginBottom: '0px',
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

const renderSkeletonBlocks = (isMobile: boolean) => {
  const size = isMobile ? 6 : 8;
  const row = Array(size).fill(0);
  return (
    <Grid container spacing={{ xs: 2, md: 3 }} width="100%">
      {row.map((_, index) => (
        <Grid size={{ xs: 6, md: 3 }} key={`first-${index}`}>
          <StatsCard>
            <Skeleton variant="text" width="100%" height={22} />
            <Skeleton variant="text" width="100%" height={32} />
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

  if (isCampaignLoading) return renderSkeletonBlocks(isMobile);

  if (!campaign) return null;

  const isOngoingCampaign =
    campaign.status === CampaignStatus.ACTIVE &&
    now >= campaign.start_date &&
    now <= campaign.end_date;

  const hasProgressBeforeCancel =
    campaign.status === CampaignStatus.TO_CANCEL &&
    campaign.reserved_funds !== campaign.balance;

  const showProgressWidget =
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

  const formattedReservedFunds = +formatTokenAmount(
    campaign.reserved_funds,
    campaign.fund_token_decimals
  );

  const targetInfo = getTargetInfo(campaign);

  const targetToken = getDailyTargetTokenSymbol(campaign.type, campaign.symbol);
  const { label: targetTokenSymbol } = getTokenInfo(targetToken);

  return (
    <>
      <Grid container spacing={{ xs: 2, md: 3 }} width="100%">
        <FirstRowWrapper showProgressWidget={showProgressWidget}>
          <StatsCard>
            <CardName variant="subtitle2">
              {isMobile ? 'Reward Pool' : 'Total Reward Pool'}
            </CardName>
            <CardValue>
              {formattedTokenAmount} {campaign.fund_token_symbol}
            </CardValue>
          </StatsCard>

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
        </FirstRowWrapper>
      </Grid>
      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        width="100%"
        mt={{ xs: 2, md: 3 }}
      >
        <Grid size={{ xs: 6, md: 3 }}>
          <StatsCard>
            <CardName variant="subtitle2">Reserved funds</CardName>
            <CardValue>
              {formattedReservedFunds} {campaign.fund_token_symbol}
            </CardValue>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatsCard>
            <CardName>Campaign results</CardName>
            <CampaignResultsWidget
              campaignStatus={campaign.status}
              finalResultsUrl={campaign.final_results_url}
              intermediateResultsUrl={campaign.intermediate_results_url}
            />
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatsCard>
            <CardName>Exchange</CardName>
            <CardValue>{exchangeName}</CardValue>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatsCard>
            <CardName variant="subtitle2">Symbol</CardName>
            <CardValue>{campaign.symbol}</CardValue>
          </StatsCard>
        </Grid>
      </Grid>
    </>
  );
};

export default CampaignStats;
