import { useState, type FC } from 'react';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';

import FormattedNumber from '@/components/FormattedNumber';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { type LeaderboardResponse, type Campaign } from '@/types';
import { formatAddress, getCompactNumberParts } from '@/utils';

import LeaderboardList from './List';
import MyEntryLabel from './MyEntryLabel';
import LeaderboardOverlay from './Overlay';

type Props = {
  campaign: Campaign;
  leaderboard: LeaderboardResponse;
};

const ViewAllButton = ({ handleClick }: { handleClick: () => void }) => (
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
      background:
        'linear-gradient(0deg, #251D47 12.72%, rgba(37, 29, 71, 0.00) 100%)',
    }}
  >
    <Button
      variant="outlined"
      disableRipple
      fullWidth
      onClick={handleClick}
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

const Leaderboard: FC<Props> = ({ campaign, leaderboard }) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const { activeAddress } = useActiveAccount();
  const isMobile = useIsMobile();

  const [listStart, listEnd] = calculateListSlice(
    leaderboard?.data || [],
    activeAddress
  );

  const showList = !!leaderboard?.data?.length && leaderboard.data.length > 3;
  const showViewAllButton =
    !!leaderboard?.data?.length && leaderboard.data.length > 8;

  return (
    <Stack py={3} gap={3}>
      <Typography
        component="h6"
        variant="body1"
        fontWeight={600}
        letterSpacing={3.2}
        textTransform="uppercase"
      >
        Leaderboard
      </Typography>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          bgcolor: '#251d47',
          borderRadius: '8px',
          border: '1px solid #433679',
          overflow: 'hidden',
        }}
      >
        <Box
          display="flex"
          alignItems="end"
          pt={4}
          px={{ xs: 0, md: 4 }}
          gap={{ xs: 0, md: 2 }}
          borderBottom={showList ? '1px solid #3a2e6f' : 'none'}
        >
          {leaderboard?.data.slice(0, 3)?.map((entry) => {
            const { rank, address, result } = entry;
            const { value, suffix, decimals } = getCompactNumberParts(result);
            const isMyEntry = address === activeAddress;
            return (
              <Stack
                key={address}
                alignItems="center"
                px={{ xs: 1.5, md: 4 }}
                pb={{ xs: 1.5, md: 3 }}
                flex={1}
                maxWidth="calc(100% / 3)"
                height={{
                  xs: rank === 1 ? '192px' : rank === 2 ? '166px' : '148px',
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
                      {formatAddress(address)}
                    </Typography>
                    {isMyEntry && <MyEntryLabel />}
                  </Stack>
                </Box>
                <Stack
                  alignItems="center"
                  width="100%"
                  py={{ xs: 1, md: 1.5 }}
                  gap={{ xs: 0.5, md: 1.5 }}
                  borderRadius="8px"
                  border={{ xs: 'none', md: '1px solid #433679' }}
                  bgcolor="#251d47"
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    flexDirection="column"
                    color={isMobile ? 'white' : 'text.primary'}
                  >
                    <Typography
                      component="span"
                      fontSize={{ xs: '16px', md: '24px' }}
                      fontWeight={{ xs: 600, md: 700 }}
                      lineHeight={1}
                    >
                      <FormattedNumber
                        value={value}
                        decimals={decimals}
                        prefix="$"
                        suffix={suffix}
                      />
                    </Typography>
                    <Typography
                      component="span"
                      display={{ xs: 'none', md: 'inline' }}
                      fontSize="12px"
                      fontWeight={500}
                      lineHeight={1}
                    >
                      Volume
                    </Typography>
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    flexDirection={{ xs: 'row', md: 'column-reverse' }}
                    color={isMobile ? 'white' : 'text.primary'}
                  >
                    <Typography
                      component="span"
                      fontSize="12px"
                      fontWeight={500}
                      lineHeight={1}
                      mr={{ xs: 0.5, md: 0 }}
                    >
                      {isMobile ? 'Score:' : 'Score'}
                    </Typography>
                    <Typography
                      component="span"
                      fontSize={{ xs: '12px', md: '24px' }}
                      fontWeight={{ xs: 600, md: 700 }}
                      lineHeight={1}
                    >
                      <FormattedNumber
                        value={value}
                        decimals={decimals}
                        suffix={suffix}
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
              data={leaderboard?.data.slice(listStart, listEnd) || []}
            />
          )}
          {showViewAllButton && (
            <ViewAllButton handleClick={() => setIsOverlayOpen(true)} />
          )}
        </Stack>
      </Paper>
      <LeaderboardOverlay
        open={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        data={leaderboard?.data || []}
        symbol={campaign.symbol}
      />
    </Stack>
  );
};

export default Leaderboard;
