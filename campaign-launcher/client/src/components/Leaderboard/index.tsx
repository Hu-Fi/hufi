import { type FC } from 'react';

import { Stack, Typography } from '@mui/material';

import { useGetLeaderboard } from '@/hooks/recording-oracle';
import { LeaderboardRanking, type Campaign } from '@/types';

type Props = {
  campaign: Campaign;
};

const Leaderboard: FC<Props> = ({ campaign }) => {
  const { data: leaderboard } = useGetLeaderboard(
    campaign.address,
    LeaderboardRanking.CURRENT_PROGRESS
  );

  // eslint-disable-next-line no-console
  console.log('leaderboard', leaderboard);

  return (
    <Stack>
      <Typography
        component="h6"
        variant="body1"
        fontWeight={600}
        letterSpacing={3.2}
        textTransform="uppercase"
      >
        Leaderboard
      </Typography>
    </Stack>
  );
};

export default Leaderboard;
