import { type FC } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { CardName, StatsCard } from '@/components/CampaignStats';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { SuccessIcon } from '@/icons';

type Props = {
  userResult: number;
  fundToken: string;
  target: number;
};

const SuccessCircle = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      bgcolor: 'background.paper',
      borderRadius: '100%',
      border: '1px solid',
      borderColor: 'neutral.200',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        bgcolor: 'success.main',
        borderRadius: '100%',
      }}
    >
      <SuccessIcon sx={{ fontSize: 24, color: 'background.paper' }} />
    </Box>
  </Box>
);

const UserProgressWidget: FC<Props> = ({ userResult, fundToken, target }) => {
  const percentage = Math.round((userResult / target) * 100);
  const isTargetAchieved = userResult >= target;

  const isMobile = useIsMobile();

  return (
    <StatsCard withBorder>
      <CardName>User Progress</CardName>
      <Stack sx={{ gap: 3, mt: { xs: 0, md: isTargetAchieved ? -1.5 : -3 } }}>
        {isTargetAchieved ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SuccessCircle />
            <Stack sx={{ gap: 1 }}>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                component="p"
                sx={{ color: 'neutral.100' }}
              >
                Target achieved!
              </Typography>
              <Typography
                variant={isMobile ? 'body1' : 'body3'}
                component="p"
                sx={{ color: 'text.secondary' }}
              >
                You&apos;re qualified for this cycle&apos;s reward.
              </Typography>
            </Stack>
          </Box>
        ) : (
          <>
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
          </>
        )}
      </Stack>
    </StatsCard>
  );
};

export default UserProgressWidget;
