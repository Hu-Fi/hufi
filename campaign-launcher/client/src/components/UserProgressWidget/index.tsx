import { FC } from 'react';

import { Box, Skeleton, Stack, Typography } from '@mui/material';

import { UserProgress } from '../../types';
import dayjs from '../../utils/dayjs';

type Props = {
  data: UserProgress | undefined;
  volumeTokenSymbol: string;
  loading: boolean;
}

const formatTime = (dateString: string): string => {
  const date = dayjs(dateString);
  return date.format('HH:mm:ss');
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year} ${formatTime(dateString)}`;
};

const UserProgressWidget: FC<Props> = ({ data, volumeTokenSymbol, loading }) => {
  return (
    <Stack justifyContent="space-between" gap={{ xs: 2, md: 0 }}>
      <Typography variant="subtitle2">My Campaign Progress</Typography>
      <Stack gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2" width={40}>From:</Typography>
          {loading ? <Skeleton variant="text" width={180} height={22} /> : <Typography variant="subtitle2">{formatDate(data?.from)}</Typography>}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2" width={40}>To:</Typography>
          {loading ? <Skeleton variant="text" width={180} height={22} /> : <Typography variant="subtitle2">{formatDate(data?.to)}</Typography>}
        </Box>
      </Stack>
      <Stack gap={1}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="subtitle2" width={90}>Total Volume</Typography>
          {loading ? <Skeleton variant="text" width={180} height={32} /> : <Typography variant="h6" color="primary.violet" fontWeight={700}>{data?.total_volume} {volumeTokenSymbol}</Typography>}
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="subtitle2" width={90}>My Score</Typography>
          {loading ? <Skeleton variant="text" width={180} height={32} /> : <Typography variant="h6" color="primary.violet" fontWeight={700}>{data?.my_score}</Typography>}
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="subtitle2" width={90}>My Volume</Typography>
          {loading ? <Skeleton variant="text" width={180} height={32} /> : <Typography variant="h6" color="primary.violet" fontWeight={700}>{data?.my_volume} {volumeTokenSymbol}</Typography>}
        </Box>
      </Stack>
    </Stack>
  )
};

export default UserProgressWidget;
