import { useMemo, useState, type FC } from 'react';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';

import FormattedNumber from '@/components/FormattedNumber';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { type LeaderboardData, type Campaign, CampaignType } from '@/types';
import { formatAddress, getCompactNumberParts } from '@/utils';
import dayjs from '@/utils/dayjs';

import LeaderboardList from './List';
import MyEntryLabel from './MyEntryLabel';
import LeaderboardOverlay from './Overlay';

const ViewAllButton = ({ onClick }: { onClick: () => void }) => (
  <Box
    display="flex"
    alignItems="end"
    height={{ xs: 'auto', md: '180px' }}
    px={{ xs: 2, md: 4 }}
    pb={1.5}
    pt={{ xs: 1.5, md: 0 }}
    position={{ xs: 'relative', md: 'absolute' }}
    bottom={0}
    left={0}
    right={0}
    sx={{
      background: {
        xs: '#251d47',
        md: 'linear-gradient(0deg, #251D47 12.72%, rgba(37, 29, 71, 0.00) 100%)',
      },
    }}
  >
    <Button
      variant="outlined"
      fullWidth
      onClick={onClick}
      sx={{
        color: 'white',
        borderColor: 'error.main',
        height: 'fit-content',
      }}
    >
      View All
    </Button>
  </Box>
);

const calculateListSlice = (
  leaderboard: { address: string }[],
  activeAddress?: string
): [number, number] => {
  const DEFAULT_START = 3;
  const WINDOW = 5;
  const total = leaderboard.length;

  const userIndex = activeAddress
    ? leaderboard.findIndex((entry) => entry.address === activeAddress)
    : -1;

  if (userIndex === -1) {
    return [DEFAULT_START, DEFAULT_START + WINDOW];
  }

  const idealStart = userIndex - 2;
  const minStart = DEFAULT_START;
  const maxStart = Math.max(DEFAULT_START, total - WINDOW);

  const start = Math.min(maxStart, Math.max(minStart, idealStart));
  const end = start + WINDOW;

  return [start, end];
};

export const formatActualOnDate = (date: string) => {
  const value = dayjs(date);
  const localTime = value.format('HH:mm');

  if (value.isSame(dayjs(), 'day')) {
    return localTime;
  }

  return `${value.format('Do MMM')} ${localTime}`;
};

export const getTargetLabel = (campaignType: CampaignType): string => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return 'Volume';
    case CampaignType.HOLDING:
      return 'Balance';
    default:
      return 'Volume';
  }
};
type Props = {
  campaign: Campaign;
  leaderboard: LeaderboardData;
};

const Leaderboard: FC<Props> = ({ campaign, leaderboard }) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const { activeAddress } = useActiveAccount();
  const isMobile = useIsMobile();

  const [listStart, listEnd] = useMemo(
    () => calculateListSlice(leaderboard.data, activeAddress),
    [leaderboard.data, activeAddress]
  );

  const showList = leaderboard.data.length > 3;
  const showViewAllButton = leaderboard.data.length > 8;

  return (
    <Stack
      component="section"
      py={3}
      mx={{ xs: -2, md: 0 }}
      px={{ xs: 2, md: 0 }}
      gap={{ xs: 1, md: 3 }}
      borderBottom="1px solid #473C74"
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
      >
        <Typography
          component="h6"
          color={isMobile ? 'white' : 'text.primary'}
          fontSize={{ xs: '20px', md: '16px' }}
          fontWeight={{ xs: 500, md: 600 }}
          letterSpacing={{ xs: 0, md: 3.2 }}
          textTransform={{ xs: 'none', md: 'uppercase' }}
        >
          Leaderboard
        </Typography>
        <Typography
          component="p"
          fontSize={{ xs: '12px', md: '16px' }}
          fontWeight={500}
          lineHeight={1}
          sx={{
            opacity: 0.6,
          }}
        >
          Actual on: {formatActualOnDate(leaderboard.updated_at)}
        </Typography>
      </Box>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          bgcolor: { xs: 'transparent', md: '#251d47' },
          borderRadius: '8px',
          border: { xs: 'none', md: '1px solid #433679' },
          overflow: 'hidden',
        }}
      >
        <Box
          display="flex"
          alignItems="end"
          pt={{ xs: 0, md: 4 }}
          px={{ xs: 0, md: 4 }}
          gap={{ xs: 0, md: 2 }}
          borderBottom={showList ? '1px solid #3a2e6f' : 'none'}
        >
          {leaderboard.data.slice(0, 3).map((entry) => {
            const { rank, address, result, score, estimated_reward } = entry;
            const {
              value: resultValue,
              suffix: resultSuffix,
              decimals: resultDecimals,
            } = getCompactNumberParts(result);
            const {
              value: scoreValue,
              suffix: scoreSuffix,
              decimals: scoreDecimals,
            } = getCompactNumberParts(score);
            const {
              value: rewardValue,
              suffix: rewardSuffix,
              decimals: rewardDecimals,
            } = getCompactNumberParts(estimated_reward);
            const isMyEntry = address === activeAddress;
            return (
              <Stack
                key={address}
                alignItems="center"
                px={{ xs: 1, md: 4 }}
                pb={{ xs: 1.5, md: 3 }}
                flex={1}
                maxWidth="calc(100% / 3)"
                height={{
                  xs: rank === 1 ? '192px' : rank === 2 ? '173px' : '155px',
                  md: rank === 1 ? '287px' : rank === 2 ? '251px' : '214px',
                }}
                borderRadius="15px 15px 0 0"
                border={{
                  xs: 'none',
                  md: '1px solid #3a2e6f',
                }}
                borderBottom={{ xs: 'none', md: 'none' }}
                sx={{
                  background: {
                    xs: '#3a2e6f',
                    md: 'linear-gradient(180deg, #3a2e6f 0%, #231d3e 100%)',
                  },
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  flexDirection={{ xs: 'column', md: 'row' }}
                  gap={{ xs: 0, md: 1 }}
                  my="auto"
                >
                  <Typography
                    color="transparent"
                    fontSize={{
                      xs: rank === 1 ? '42px' : '36px',
                      md: rank === 1 ? '68px' : rank === 2 ? '48px' : '40px',
                    }}
                    lineHeight={1}
                    fontWeight={700}
                    sx={{
                      background:
                        rank === 1
                          ? 'linear-gradient(135deg, #eb5088 46.1%, #5630ff 113.92%)'
                          : 'none',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: rank === 1 ? 'transparent' : 'white',
                    }}
                  >
                    #{rank}
                  </Typography>
                  <Stack gap={0.5} alignItems="center">
                    <Typography
                      component="p"
                      variant={isMobile ? 'caption' : 'h6'}
                      color="#e8e8e8"
                      fontWeight={600}
                      letterSpacing={{ xs: 0, md: 2 }}
                    >
                      {formatAddress(address, 4, 2)}
                    </Typography>
                    {isMyEntry && <MyEntryLabel />}
                  </Stack>
                </Box>
                <Stack
                  alignItems="center"
                  width="100%"
                  py={{ xs: 1, md: 1.5 }}
                  px={{ xs: 1, md: 1.5 }}
                  gap={{ xs: 0.5, md: 1.5 }}
                  borderRadius="8px"
                  border={{ xs: 'none', md: '1px solid #433679' }}
                  bgcolor="#251d47"
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%"
                  >
                    <Typography
                      component="span"
                      fontSize={{ xs: 10, md: 12 }}
                      fontWeight={500}
                      lineHeight={1}
                    >
                      {`${getTargetLabel(campaign.type)}`}
                    </Typography>
                    <Typography
                      component="span"
                      fontSize={{ xs: 12, md: 20 }}
                      fontWeight={600}
                      lineHeight={1}
                    >
                      <FormattedNumber
                        value={resultValue}
                        decimals={resultDecimals}
                        prefix="$"
                        suffix={resultSuffix}
                      />
                    </Typography>
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%"
                  >
                    <Typography
                      component="span"
                      fontSize={{ xs: 10, md: 12 }}
                      fontWeight={500}
                      lineHeight={1}
                      mr={{ xs: 0.5, md: 0 }}
                    >
                      Score
                    </Typography>
                    <Typography
                      component="span"
                      fontSize={{ xs: 12, md: 20 }}
                      fontWeight={600}
                      lineHeight={1}
                    >
                      <FormattedNumber
                        value={scoreValue}
                        decimals={scoreDecimals}
                        suffix={scoreSuffix}
                      />
                    </Typography>
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%"
                  >
                    <Typography
                      component="span"
                      fontSize={{ xs: 10, md: 12 }}
                      fontWeight={500}
                      lineHeight={1}
                      mr={{ xs: 0.5, md: 0 }}
                    >
                      Reward
                    </Typography>
                    <Typography
                      component="span"
                      fontSize={{ xs: 12, md: 20 }}
                      fontWeight={600}
                      lineHeight={1}
                    >
                      <FormattedNumber
                        value={rewardValue}
                        decimals={rewardDecimals}
                        prefix="$"
                        suffix={rewardSuffix}
                      />
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            );
          })}
        </Box>
        <Stack position="relative">
          {showList && (
            <LeaderboardList
              data={leaderboard.data.slice(listStart, listEnd)}
              activeAddress={activeAddress}
              campaignType={campaign.type}
            />
          )}
          {showViewAllButton && (
            <ViewAllButton onClick={() => setIsOverlayOpen(true)} />
          )}
        </Stack>
      </Paper>
      <LeaderboardOverlay
        open={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        data={leaderboard.data}
        updatedAt={leaderboard.updated_at}
        symbol={campaign.symbol}
        campaignType={campaign.type}
      />
    </Stack>
  );
};

export default Leaderboard;
