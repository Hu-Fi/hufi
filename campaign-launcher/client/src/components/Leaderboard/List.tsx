import { memo } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { type EvmAddress, type LeaderboardEntry } from '@/types';
import { formatAddress, getCompactNumberParts } from '@/utils';

import FormattedNumber from '../FormattedNumber';

import MyEntryLabel from './MyEntryLabel';

type Props = {
  data: LeaderboardEntry[];
  activeAddress?: EvmAddress;
};

const LeaderboardList = memo(({ data, activeAddress }: Props) => (
  <Stack flex={1} minHeight={0} overflow="auto">
    {data.map((entry) => {
      const { address, rank, result, score } = entry;
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
      const isMyEntry = address.toLowerCase() === activeAddress?.toLowerCase();
      return (
        <Box
          key={address}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          height="60px"
          gap={1}
          px={{ xs: 2, md: 4 }}
          py={1.5}
          bgcolor={isMyEntry ? '#3a2e6f' : 'transparent'}
          borderBottom="1px solid #3a2e6f"
          sx={{
            '&:last-of-type': {
              borderBottom: 'none',
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={1} color="white">
            <Typography variant="body1" fontWeight={500} mr={1}>
              #{rank}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatAddress(address)}
            </Typography>
            {isMyEntry && <MyEntryLabel />}
          </Box>
          <Box display="flex" alignItems="center" gap={3}>
            <Stack alignItems="center">
              <Typography variant="body2" color="white" fontWeight={500}>
                <FormattedNumber
                  value={scoreValue}
                  decimals={scoreDecimals}
                  suffix={scoreSuffix}
                />
              </Typography>
              <Typography variant="caption">Score</Typography>
            </Stack>
            <Stack alignItems="center">
              <Typography variant="body2" color="white" fontWeight={500}>
                <FormattedNumber
                  value={resultValue}
                  prefix="$"
                  decimals={resultDecimals}
                  suffix={resultSuffix}
                />
              </Typography>
              <Typography variant="caption">Volume</Typography>
            </Stack>
          </Box>
        </Box>
      );
    })}
  </Stack>
));

export default LeaderboardList;
