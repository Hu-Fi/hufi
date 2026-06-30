import { type FC } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { CardName, StatsCard } from '@/components/CampaignStats';

type Props = {
  userResult: number;
  fundToken: string;
  target: number;
};

const UserProgressWidget: FC<Props> = ({ userResult, fundToken, target }) => {
  const percentage = Math.round((userResult / target) * 100);
  return (
    <StatsCard withBorder>
      <CardName>User Progress</CardName>
      <Stack sx={{ gap: 3, mt: -3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 10,
              bgcolor: 'background.subtle',
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'border.main',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${percentage}%`,
                maxWidth: '100%',
                height: '100%',
                bgcolor: 'neutral.200',
                borderRadius: '16px',
              }}
            />
          </Box>
          <Typography
            component="span"
            variant="h3"
            sx={{
              width: 88,
              textAlign: 'right',
              color: 'neutral.200',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {percentage}%
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mr: 15,
          }}
        >
          <Typography variant="body3" sx={{ fontWeight: 600 }}>
            {`${userResult} / ${target} ${fundToken}`}
          </Typography>
          <Typography variant="body4">
            <Typography variant="body4" sx={{ color: 'neutral.300' }}>
              {Math.round(target - userResult)} {fundToken}
            </Typography>{' '}
            remaining to qualify
          </Typography>
        </Box>
      </Stack>
    </StatsCard>
  );
};

export default UserProgressWidget;
