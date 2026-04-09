import { type FC, useEffect, useMemo, useState } from 'react';

import { Box, Grid, Stack, Typography } from '@mui/material';

import { CardName, CardValue, StatsCard } from '@/components/CampaignStats';
import FormattedNumber from '@/components/FormattedNumber';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { CampaignType, type LeaderboardData, type Campaign } from '@/types';
import {
  formatTokenAmount,
  getCompactNumberParts,
  getDailyTargetTokenSymbol,
  getTokenInfo,
} from '@/utils';

type Props = {
  campaign: Campaign;
  leaderboard: LeaderboardData;
};

const CYCLE_DURATION_MS = 24 * 60 * 60 * 1000;

const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}h:${minutes
      .toString()
      .padStart(2, '0')}m:${seconds.toString().padStart(2, '0')}s`;
  }

  if (minutes > 0) {
    return `${minutes.toString().padStart(2, '0')}m:${seconds
      .toString()
      .padStart(2, '0')}s`;
  }

  return `${seconds}s`;
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
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const totalCycles = Math.ceil((end - start) / CYCLE_DURATION_MS);
    const effectiveNow = Math.min(Math.max(now, start), end);
    const elapsedSinceStart = effectiveNow - start;
    const currentCycle = Math.min(
      totalCycles,
      Math.floor(elapsedSinceStart / CYCLE_DURATION_MS) + 1
    );

    const currentCycleStart = start + (currentCycle - 1) * CYCLE_DURATION_MS;
    const currentCycleEnd = Math.min(
      currentCycleStart + CYCLE_DURATION_MS,
      end
    );
    const remainingMs = Math.max(0, currentCycleEnd - now);

    return {
      currentCycle,
      totalCycles,
      remainingTime: formatDuration(remainingMs),
    };
  }, [startDate, endDate, now]);

  return cycleTimeInfo;
};

const getTotalGeneratedCardTitle = (campaignType: CampaignType) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return 'Total Generated Volume';
    case CampaignType.HOLDING:
      return 'Total Generated Balance';
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

  const {
    value: totalGeneratedValue,
    suffix: totalGeneratedSuffix,
    decimals: totalGeneratedDecimals,
  } = getCompactNumberParts(leaderboard.total);

  const eligibleParticipants = leaderboard.data.filter(
    (entry) => entry.score > 0
  );

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
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        width="100%"
      >
        <Typography
          component="h6"
          color={isMobile ? 'white' : 'text.primary'}
          fontSize={{ xs: 20, md: 16 }}
          fontWeight={{ xs: 500, md: 600 }}
          letterSpacing={{ xs: 0, md: '3.2px' }}
          textTransform={{ xs: 'none', md: 'uppercase' }}
        >
          Cycle Info
        </Typography>
        <Box display="flex" alignItems="center" gap={1} sx={{ opacity: 0.6 }}>
          <Typography
            component="span"
            fontSize={{ xs: 12, md: 16 }}
            fontWeight={500}
          >
            {`Cycle ${cycleTimeline.currentCycle} of ${cycleTimeline.totalCycles}`}
          </Typography>
          <Box
            width={4}
            height={4}
            borderRadius="50%"
            bgcolor="text.primary"
            sx={{ opacity: 0.6 }}
          />
          <Typography
            component="span"
            fontSize={{ xs: 12, md: 16 }}
            fontWeight={500}
          >
            Resets every 24h
          </Typography>
        </Box>
      </Box>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatsCard withBorder>
            <CardName>Cycle Reward Pool</CardName>
            <CardValue color="#46db99">
              <FormattedNumber
                value={rewardPool / cycleTimeline.totalCycles}
                decimals={2}
                suffix={` ${campaign.fund_token_symbol}`}
              />
            </CardValue>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatsCard withBorder>
            <CardName>Ends in</CardName>
            <CardValue color="text.primary">
              {cycleTimeline.remainingTime}
            </CardValue>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatsCard withBorder>
            <CardName>
              {isThreshold
                ? 'Eligible Participants'
                : getTotalGeneratedCardTitle(campaign.type)}
            </CardName>
            <CardValue>
              {isThreshold ? (
                eligibleParticipants.length
              ) : (
                <FormattedNumber
                  value={totalGeneratedValue}
                  decimals={totalGeneratedDecimals}
                  suffix={totalGeneratedSuffix + ' ' + targetTokenSymbol}
                />
              )}
            </CardValue>
          </StatsCard>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default CycleInfoSection;
