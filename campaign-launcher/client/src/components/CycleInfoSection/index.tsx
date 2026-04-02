import { type FC, useEffect, useMemo, useState } from 'react';

import { Box, Grid, Stack, Typography } from '@mui/material';

import { CardName, CardValue, StatsCard } from '@/components/CampaignStats';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { type Campaign } from '@/types';
import { formatTokenAmount } from '@/utils';

type Props = {
  campaign: Campaign;
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

const CycleInfoSection: FC<Props> = ({ campaign }) => {
  const isMobile = useIsMobile();

  const cycleTimeline = useCycleTimeline(
    campaign.start_date,
    campaign.end_date
  );
  const rewardPool = +formatTokenAmount(
    campaign.fund_amount,
    campaign.fund_token_decimals
  );

  return (
    <Stack
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
            <CardValue>
              {rewardPool} {campaign.fund_token_symbol}
            </CardValue>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatsCard withBorder>
            <CardName>Ends in</CardName>
            <CardValue>{cycleTimeline.remainingTime}</CardValue>
          </StatsCard>
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatsCard withBorder>
            <CardName>Current Cycle</CardName>
            <CardValue>
              {cycleTimeline.currentCycle} / {cycleTimeline.totalCycles}
            </CardValue>
          </StatsCard>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default CycleInfoSection;
