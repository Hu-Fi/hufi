import { type FC, useEffect, useMemo, useState } from 'react';

import { Box, Grid, Stack, Typography } from '@mui/material';

import { CardName, CardValue, StatsCard } from '@/components/CampaignStats';
import CompactNumberWithTooltip from '@/components/CompactNumberWithTooltip';
import CustomTooltip from '@/components/CustomTooltip';
import FormattedNumber from '@/components/FormattedNumber';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { CampaignType, type LeaderboardData, type Campaign } from '@/types';
import {
  formatTokenAmount,
  getDailyTargetTokenSymbol,
  getTokenInfo,
} from '@/utils';
import dayjs from '@/utils/dayjs';

const IndividualRewardTooltip = () => {
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
          <Typography
            sx={{
              fontSize: 14,
              color: '#161616',
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: 0,
            }}
          >
            For each cycle, the total reward pool is evenly distributed among
            all eligible participants.
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              color: '#161616',
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: 0,
            }}
          >
            Reward per cycle = Total reward pool ÷ eligible participants
          </Typography>
        </Box>
      }
      arrow
      placement="top"
    >
      <InfoTooltipInner
        sx={{
          width: { xs: 16, md: 24 },
          height: { xs: 16, md: 24 },
          px: 0.5,
          bgcolor: 'transparent',
          border: { xs: '1px solid', md: '2px solid' },
          borderColor: { xs: 'text.secondary', md: '#6b6490' },
          '& > span': {
            fontSize: { xs: 10, md: 14 },
            color: { xs: 'text.secondary', md: '#6b6490' },
          },
        }}
      />
    </CustomTooltip>
  );
};

type Props = {
  campaign: Campaign;
  leaderboard: LeaderboardData;
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
      return isMobile ? 'Total Generated Vol.' : 'Total Generated Volume';
    case CampaignType.HOLDING:
      return 'Total Held';
  }
};

const CycleInfoSection: FC<Props> = ({ campaign, leaderboard }) => {
  const isMobile = useIsMobile();

  const isThreshold = campaign.type === CampaignType.THRESHOLD;

  const cycleTimeline = useCycleTimeline(
    campaign.start_date,
    campaign.end_date
  );
  const rewardPool = +formatTokenAmount(
    campaign.fund_amount,
    campaign.fund_token_decimals
  );

  const targetToken = getDailyTargetTokenSymbol(campaign.type, campaign.symbol);
  const { label: targetTokenSymbol } = getTokenInfo(targetToken);

  const eligibleParticipants = leaderboard.data.filter(
    (entry) => entry.score > 0
  );

  return (
    <Stack
      component="section"
      sx={{
        mx: { xs: -2, md: 0 },
        px: { xs: 2, md: 0 },
        pt: 3,
        pb: { xs: 2, md: 3 },
        gap: { xs: 2, md: 3 },
        borderBottom: '1px solid #473C74',
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
            color: isMobile ? 'white' : 'text.primary',
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
          <Typography
            component="span"
            sx={{
              fontSize: { xs: 12, md: 16 },
              fontWeight: 500,
            }}
          >
            {`Cycle ${cycleTimeline.currentCycle} of ${cycleTimeline.totalCycles}`}
          </Typography>
          <Box
            sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              bgcolor: 'text.primary',
              opacity: 0.6,
            }}
          />
          <Typography
            component="span"
            sx={{
              fontSize: { xs: 12, md: 16 },
              fontWeight: 500,
            }}
          >
            Resets every 24h
          </Typography>
        </Box>
      </Box>
      <Grid container spacing={{ xs: 1.5, md: 3 }}>
        <Grid
          size={{ xs: 6, md: 4 }}
          sx={{
            order: { xs: isThreshold ? 3 : 2, md: 1 },
          }}
        >
          <StatsCard withBorder>
            <CardName>Cycle Reward Pool</CardName>
            <CardValue color={isThreshold ? 'white' : '#46db99'}>
              <FormattedNumber
                value={rewardPool / cycleTimeline.totalCycles}
                decimals={2}
                suffix={` ${campaign.fund_token_symbol}`}
              />
            </CardValue>
          </StatsCard>
        </Grid>
        {isThreshold ? (
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
                  <CardName>Individual Reward</CardName>
                  <IndividualRewardTooltip />
                </Box>
                <CardValue
                  color={eligibleParticipants.length > 0 ? '#46db99' : 'white'}
                >
                  {eligibleParticipants.length > 0 ? (
                    <FormattedNumber
                      value={
                        rewardPool /
                        cycleTimeline.totalCycles /
                        eligibleParticipants.length
                      }
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
                />
                {targetTokenSymbol}
              </CardValue>
            </StatsCard>
          </Grid>
        )}
        <Grid
          size={{ xs: 6, md: 4 }}
          sx={{
            order: { xs: 1, md: isThreshold ? 4 : 3 },
          }}
        >
          <StatsCard withBorder>
            <CardName>Ends in</CardName>
            <CardValue color="text.primary">
              {cycleTimeline.remainingTime}
            </CardValue>
          </StatsCard>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default CycleInfoSection;
