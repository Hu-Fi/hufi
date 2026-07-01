import { type FC } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { CardName, StatsCard } from '@/components/CampaignStats';
import FormattedNumber from '@/components/FormattedNumber';
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
  const percentage = Math.floor((userResult / target) * 100);
  const isTargetAchieved = userResult > target;

  const isMobile = useIsMobile();

  return (
    <StatsCard withBorder>
      <CardName>User Progress</CardName>
      <Stack
        sx={{
          gap: { xs: 2, md: 3 },
          mt: { xs: 0, md: isTargetAchieved ? -1.5 : -3 },
        }}
      >
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 2, md: 4 },
              }}
            >
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
                variant={isMobile ? 'h5' : 'h3'}
                sx={{
                  width: { xs: 'fit-content', md: 88 },
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
                mr: { xs: 0, md: 15 },
              }}
            >
              <Typography
                variant={isMobile ? 'body1' : 'body3'}
                sx={{ fontWeight: 600 }}
              >
                <FormattedNumber value={userResult} decimals={2} />
                {' / '}
                <FormattedNumber
                  value={target}
                  decimals={2}
                  suffix={` ${fundToken}`}
                />
              </Typography>
              <Typography variant={isMobile ? 'body1' : 'body4'}>
                <Typography
                  component="span"
                  variant={isMobile ? 'body1' : 'body4'}
                  sx={{ color: 'neutral.300' }}
                >
                  <FormattedNumber
                    value={Math.floor((target - userResult) * 100) / 100}
                    decimals={2}
                    suffix={` ${fundToken}`}
                  />
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
