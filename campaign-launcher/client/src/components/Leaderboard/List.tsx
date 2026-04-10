import { memo } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import FormattedNumber from '@/components/FormattedNumber';
import {
  type CampaignType,
  type EvmAddress,
  type LeaderboardEntry,
} from '@/types';
import { formatAddress, getCompactNumberParts } from '@/utils';

import MyEntryLabel from './MyEntryLabel';

import { getTargetLabel } from '.';

type Props = {
  data: LeaderboardEntry[];
  activeAddress: EvmAddress | undefined;
  campaignType: CampaignType;
  tokenSymbol: string;
};

const LeaderboardList = memo(
  ({ data, activeAddress, campaignType, tokenSymbol }: Props) => (
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
        const isMyEntry = address === activeAddress;
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
                    decimals={resultDecimals}
                    suffix={resultSuffix + ' ' + tokenSymbol}
                  />
                </Typography>
                <Typography variant="caption">
                  {getTargetLabel(campaignType)}
                </Typography>
              </Stack>
            </Box>
          </Box>
        );
      })}
    </Stack>
  )
);

export default LeaderboardList;
