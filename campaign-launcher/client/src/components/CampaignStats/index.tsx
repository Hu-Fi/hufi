import { type FC } from 'react';

import { Box, Skeleton, Stack, styled, Typography, Grid } from '@mui/material';

import CampaignSymbol from '@/components/CampaignSymbol';
import FormattedNumber from '@/components/FormattedNumber';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { CancelIcon } from '@/icons';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import {
  CampaignStatus,
  type LeaderboardData,
  type CampaignDetails,
} from '@/types';
import {
  getCompactNumberParts,
  getDailyTargetTokenSymbol,
  getTargetInfo,
  getTokenInfo,
  mapTypeToLabel,
} from '@/utils';
import dayjs from '@/utils/dayjs';

export const StatsCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'withBorder',
})<{ withBorder?: boolean }>(({ theme, withBorder }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'start',
  height: '175px',
  padding: '32px',
  flex: 1,
  gap: '45px',
  ...(withBorder && {
    backgroundColor: '#251D47',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }),

  [theme.breakpoints.down('md')]: {
    height: 'auto',
    minHeight: '90px',
    padding: '12px',
    gap: '8px',
    ...(withBorder && {
      borderRadius: '8px',
    }),
  },
}));

export const CardName = styled(Typography)(({ theme }) => ({
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

export const CardValue = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color?: string }>(({ theme, color = 'white' }) => ({
  color,
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
  return (
    <Stack
      mx={{ xs: -2, md: 0 }}
      px={{ xs: 2, md: 0 }}
      pt={3}
      pb={{ xs: 2, md: 3 }}
      gap={{ xs: 2, md: 3 }}
      borderBottom="1px solid #473C74"
    >
      <Skeleton variant="text" width="100%" height={isMobile ? 30 : 24} />
      <Skeleton
        variant="rectangular"
        width="100%"
        height={isMobile ? 270 : 175}
      />
      <Skeleton
        variant="rectangular"
        width="100%"
        height={isMobile ? 90 : 175}
      />
    </Stack>
  );
};

const formatCancellationRequestedAt = (date: number) => {
  return dayjs(date).format('Do MMM YYYY HH:mm');
};

type Props = {
  campaign: CampaignDetails | null | undefined;
  isJoined: boolean;
  isCampaignLoading: boolean;
  leaderboard?: LeaderboardData;
};

const CampaignStats: FC<Props> = ({
  campaign,
  isJoined,
  isCampaignLoading,
  leaderboard,
}) => {
  const { exchangesMap } = useExchangesContext();
  const { isAuthenticated } = useWeb3Auth();
  const { activeAddress } = useActiveAccount();
  const isMobile = useIsMobile();

  if (isCampaignLoading) return renderSkeletonBlocks(isMobile);

  if (!campaign) return null;

  const isCancelled =
    campaign.status === CampaignStatus.CANCELLED &&
    !!campaign.cancellation_requested_at;

  const isOngoingCampaign =
    campaign.status === CampaignStatus.ACTIVE &&
    now >= campaign.start_date &&
    now <= campaign.end_date;

  const hasProgressBeforeCancel =
    campaign.status === CampaignStatus.TO_CANCEL &&
    campaign.reserved_funds !== campaign.balance;

  const totalParticipants = leaderboard?.data.length || 0;

  const userRank = leaderboard?.data.find(
    (entry) => entry.address.toLowerCase() === activeAddress?.toLowerCase()
  )?.rank;

  const showUserPerformance =
    isAuthenticated &&
    isJoined &&
    !!userRank &&
    (isOngoingCampaign || hasProgressBeforeCancel);

  const exchangeName =
    exchangesMap.get(campaign.exchange_name)?.display_name ||
    campaign.exchange_name;

  const targetInfo = getTargetInfo(campaign);
  const {
    value: targetValue,
    suffix: targetSuffix,
    decimals: targetDecimals,
  } = getCompactNumberParts(targetInfo.value || 0);

  const targetToken = getDailyTargetTokenSymbol(campaign.type, campaign.symbol);
  const { label: targetTokenSymbol } = getTokenInfo(targetToken);

  return (
    <Stack
      component="section"
      mx={{ xs: -2, md: 0 }}
      px={{ xs: 2, md: 0 }}
      pt={3}
      pb={{ xs: 2, md: 3 }}
      gap={{ xs: 2, md: 3 }}
      borderBottom="1px solid #473C74"
    >
      <Typography
        component="h6"
        color={isMobile ? 'white' : 'text.primary'}
        fontSize={{ xs: 20, md: 16 }}
        fontWeight={{ xs: 500, md: 600 }}
        letterSpacing={{ xs: 0, md: '3.2px' }}
        textTransform={{ xs: 'none', md: 'uppercase' }}
      >
        Details
      </Typography>
      {isCancelled && (
        <Stack
          width="100%"
          p={4}
          gap={1.5}
          bgcolor="#361034"
          borderRadius="16px"
          border="1px solid #cb3434"
        >
          <Box display="flex" alignItems="center" gap={2}>
            <CancelIcon sx={{ fontSize: 32 }} />
            <Typography
              variant="h5"
              component="p"
              color="#fb4a4a"
              fontWeight={600}
            >
              Campaign Cancelled
            </Typography>
          </Box>
          <Typography ml={6} color="#a0a0a0">
            Cancelled on{' '}
            {formatCancellationRequestedAt(
              campaign.cancellation_requested_at || 0
            )}
          </Typography>
        </Stack>
      )}
      <Grid
        container
        width="100%"
        spacing={{ xs: 0, md: 6 }}
        bgcolor="#251d47"
        borderRadius="16px"
        border="1px solid rgba(255, 255, 255, 0.07)"
      >
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard>
            <CardName>Symbol</CardName>
            <CampaignSymbol
              symbol={campaign.symbol}
              campaignType={campaign.type}
              size={isMobile ? 'small' : 'large'}
            />
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard>
            <CardName>Exchange</CardName>
            <CardValue>{exchangeName}</CardValue>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsCard>
            <CardName>Campaign Type</CardName>
            <CardValue>{mapTypeToLabel(campaign.type)}</CardValue>
          </StatsCard>
        </Grid>
      </Grid>
      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        width="100%"
        alignItems="stretch"
      >
        <Grid size={{ xs: 6, md: 4 }}>
          <StatsCard withBorder>
            <CardName variant="subtitle2">{targetInfo.label}</CardName>
            <CardValue>
              <FormattedNumber
                value={targetValue}
                decimals={targetDecimals}
                suffix={targetSuffix + ' ' + targetTokenSymbol}
              />
            </CardValue>
          </StatsCard>
        </Grid>
        {isOngoingCampaign && (
          <Grid size={{ xs: 6, md: 4 }} display="flex">
            <StatsCard withBorder>
              <CardName variant="subtitle2">
                {showUserPerformance ? 'Ranking' : 'Total Participants'}
              </CardName>
              <CardValue>
                {showUserPerformance
                  ? `${userRank} / ${totalParticipants}`
                  : totalParticipants}
              </CardValue>
            </StatsCard>
          </Grid>
        )}
      </Grid>
    </Stack>
  );
};

export default CampaignStats;
