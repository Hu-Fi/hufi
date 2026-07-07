import { type FC, useEffect, useMemo, useState } from 'react';

import { Box, Grid, Stack, Typography } from '@mui/material';

import { CardName, CardValue, StatsCard } from '@/components/CampaignStats';
import CompactNumberWithTooltip from '@/components/CompactNumberWithTooltip';
import CustomTooltip from '@/components/CustomTooltip';
import FormattedNumber from '@/components/FormattedNumber';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import UserProgressWidget from '@/components/UserProgressWidget';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { CampaignType, type LeaderboardData, type Campaign } from '@/types';
import {
  formatTokenAmount,
  getDailyTargetTokenSymbol,
  getTokenInfo,
  isThresholdBasedCampaignType,
} from '@/utils';
import dayjs from '@/utils/dayjs';

const IndividualRewardTooltip: FC<{ hasParticipantsLimit: boolean }> = ({
  hasParticipantsLimit,
}) => {
  return (
    <CustomTooltip
      title={
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            px: { xs: 0, md: 1 },
            py: { xs: 1, md: 1.5 },
          }}
        >
          <Typography variant="body1">
            For each cycle, the total reward pool is evenly distributed among
            participants.
          </Typography>
          <Typography variant="body1">
            Reward per cycle = Total reward pool ÷{' '}
            {hasParticipantsLimit
              ? 'max participants'
              : 'eligible participants'}
          </Typography>
        </Box>
      }
      arrow
      placement="top"
    >
      <InfoTooltipInner
        component="span"
        sx={{
          width: { xs: 16, md: 24 },
          height: { xs: 16, md: 24 },
          px: 0.5,
          bgcolor: 'transparent',
          border: { xs: '1px solid', md: '2px solid' },
          borderColor: 'inherit',
          '& > span': {
            fontSize: { xs: 10, md: 14 },
            color: 'inherit',
          },
        }}
      />
    </CustomTooltip>
  );
};

type Props = {
  campaign: Campaign;
  leaderboard: LeaderboardData;
  isJoined: boolean;
};

const useCycleTimeline = (startDate: string, endDate: string) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const cycleTimeInfo = useMemo(() => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const nowDate = dayjs(now);

    const totalCycles = Math.ceil(end.diff(start, 'day', true));
    const fullCyclesPassed = nowDate.diff(start, 'day', false);
    const currentCycle = Math.min(totalCycles, fullCyclesPassed + 1);
    const cycleEndCandidate = start.add(currentCycle, 'day');
    const currentCycleEnd = cycleEndCandidate.isBefore(end)
      ? cycleEndCandidate
      : end;
    const remainingMs = Math.max(0, currentCycleEnd.diff(nowDate));

    return {
      currentCycle,
      totalCycles,
      remainingTime: dayjs
        .duration(Math.max(0, remainingMs))
        .format('HH[h]:mm[m]:ss[s]'),
    };
  }, [startDate, endDate, now]);

  return cycleTimeInfo;
};

const getTotalGeneratedCardTitle = (
  campaignType: CampaignType,
  isMobile: boolean
) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
    case CampaignType.COMPETITIVE_MARKET_MAKING:
      return isMobile ? 'Total Generated Vol.' : 'Total Generated Volume';
    case CampaignType.HOLDING:
      return 'Total Held';
  }
};

const CycleInfoSection: FC<Props> = ({ campaign, leaderboard, isJoined }) => {
  const isMobile = useIsMobile();
  const { activeAddress } = useActiveAccount();

  const isThresholdBasedCampaign = isThresholdBasedCampaignType(campaign.type);

  const userResult = activeAddress
    ? leaderboard.data.find((entry) => entry.address === activeAddress)
    : undefined;

  const showUserProgressWidget =
    isThresholdBasedCampaign && isJoined && userResult;

  const cycleTimeline = useCycleTimeline(
    campaign.start_date,
    campaign.end_date
  );
  const rewardPool = +formatTokenAmount(
    campaign.fund_amount,
    campaign.fund_token_decimals
  );

  const cycleRewardPool = rewardPool / cycleTimeline.totalCycles;

  const targetToken = getDailyTargetTokenSymbol(campaign.type, campaign.symbol);
  const { label: targetTokenSymbol } = getTokenInfo(targetToken);

  const eligibleParticipants = leaderboard.data.filter(
    (entry) => entry.score > 0
  );

  let individualReward: number | undefined;
  if (campaign.details.max_participants) {
    individualReward = cycleRewardPool / campaign.details.max_participants;
  } else if (eligibleParticipants.length > 0) {
    individualReward = cycleRewardPool / eligibleParticipants.length;
  }

  return (
    <Stack
      component="section"
      sx={{
        mx: { xs: -2, md: 0 },
        px: { xs: 2, md: 0 },
        pt: 3,
        pb: { xs: 2, md: 3 },
        gap: { xs: 2, md: 3 },
        borderBottom: '1px solid',
        borderColor: 'border.strong',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          width: '100%',
        }}
      >
        <Typography
          component="h6"
          sx={{
            color: isMobile ? 'neutral.100' : 'text.primary',
            fontSize: { xs: 20, md: 16 },
            fontWeight: { xs: 500, md: 600 },
            letterSpacing: { xs: 0, md: '3.2px' },
            textTransform: { xs: 'none', md: 'uppercase' },
          }}
        >
          Cycle Info
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            opacity: 0.6,
          }}
        >
          <Typography variant={isMobile ? 'subtitle3' : 'body3'}>
            {`Cycle ${cycleTimeline.currentCycle} of ${cycleTimeline.totalCycles}`}
          </Typography>
          <Box
            sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              opacity: 0.6,
            }}
          />
          <Typography variant={isMobile ? 'subtitle4' : 'body3'}>
            Resets every 24h
          </Typography>
        </Box>
      </Box>
      <Grid container spacing={{ xs: 1.5, md: 3 }}>
        {showUserProgressWidget && (
          <Grid size={{ xs: 12, md: 12 }}>
            <UserProgressWidget
              userResult={userResult?.result || 0}
              fundToken={campaign.fund_token_symbol}
              target={
                campaign.details.minimum_volume_target ||
                campaign.details.minimum_balance_target ||
                0
              }
            />
          </Grid>
        )}
        <Grid
          size={{ xs: 6, md: 4 }}
          sx={{
            order: { xs: isThresholdBasedCampaign ? 3 : 2, md: 1 },
          }}
        >
          <StatsCard withBorder>
            <CardName>Cycle Reward Pool</CardName>
            <CardValue
              sx={{
                color: isThresholdBasedCampaign ? 'neutral.100' : 'neutral.200',
              }}
            >
              <FormattedNumber
                value={cycleRewardPool}
                decimals={2}
                suffix={` ${campaign.fund_token_symbol}`}
              />
            </CardValue>
          </StatsCard>
        </Grid>
        {isThresholdBasedCampaign ? (
          <>
            <Grid
              size={{ xs: 6, md: 4 }}
              sx={{
                order: { xs: 4, md: 2 },
              }}
            >
              <StatsCard withBorder>
                <CardName>Eligible Participants</CardName>
                <CardValue>{eligibleParticipants.length}</CardValue>
              </StatsCard>
            </Grid>
            <Grid
              size={{ xs: 6, md: 4 }}
              sx={{
                order: { xs: 2, md: 3 },
              }}
            >
              <StatsCard withBorder>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 0.75, md: 1.5 },
                  }}
                >
                  <CardName>
                    Individual Reward{' '}
                    <IndividualRewardTooltip
                      hasParticipantsLimit={!!campaign.details.max_participants}
                    />
                  </CardName>
                </Box>
                <CardValue
                  sx={{
                    color:
                      eligibleParticipants.length > 0
                        ? 'neutral.200'
                        : 'neutral.100',
                  }}
                >
                  {individualReward ? (
                    <FormattedNumber
                      value={individualReward}
                      decimals={2}
                      suffix={` ${campaign.fund_token_symbol}`}
                    />
                  ) : (
                    'N/A'
                  )}
                </CardValue>
              </StatsCard>
            </Grid>
          </>
        ) : (
          <Grid
            size={{ xs: 6, md: 4 }}
            sx={{
              order: { xs: 3, md: 2 },
            }}
          >
            <StatsCard withBorder>
              <CardName>
                {getTotalGeneratedCardTitle(campaign.type, isMobile)}
              </CardName>
              <CardValue>
                <CompactNumberWithTooltip
                  value={leaderboard.total}
                  tooltipSize="large"
                />{' '}
                {targetTokenSymbol}
              </CardValue>
            </StatsCard>
          </Grid>
        )}
        <Grid
          size={{ xs: 6, md: 4 }}
          sx={{
            order: { xs: 1, md: isThresholdBasedCampaign ? 4 : 3 },
          }}
        >
          <StatsCard withBorder>
            <CardName>Ends in</CardName>
            <CardValue sx={{ color: 'text.primary' }}>
              {cycleTimeline.remainingTime}
            </CardValue>
          </StatsCard>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default CycleInfoSection;
