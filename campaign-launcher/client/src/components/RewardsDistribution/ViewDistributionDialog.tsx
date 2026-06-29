import { type FC } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import FormattedNumber from '@/components/FormattedNumber';
import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { getCompactNumberParts } from '@/utils';

import { RewardAmount, RewardPlace } from './components';

type Props = {
  open: boolean;
  onClose: () => void;
  rewardsDistribution: number[];
  fundAmount: string;
  fundToken: string;
};

const ViewDistributionDialog: FC<Props> = ({
  open,
  onClose,
  rewardsDistribution,
  fundAmount,
  fundToken,
}) => {
  const isMobile = useIsMobile();
  const { value, suffix, decimals } = getCompactNumberParts(Number(fundAmount));

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      desktopSx={{
        display: 'flex',
        flexDirection: 'column',
        pt: 6,
        pb: 4,
        px: 4,
        height: 550,
      }}
      mobileSx={{ p: 2, height: '70dvh' }}
    >
      <Stack sx={{ flex: 1, minHeight: 0, gap: 4 }}>
        <Typography
          component="h4"
          variant={isMobile ? 'body4' : 'h4'}
          sx={{ color: 'neutral.100' }}
        >
          Reward Distribution Split
        </Typography>
        <Stack
          sx={{
            flex: 1,
            minHeight: 0,
            bgcolor: 'background.default',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'border.strong',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 56,
              px: 1.5,
              overflow: 'hidden',
            }}
          >
            <Typography sx={{ color: 'text.auxiliary' }}>Position</Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                sx={{
                  color: 'text.auxiliary',
                  width: { xs: '110px', md: '115px' },
                  textAlign: 'center',
                }}
              >
                Reward
              </Typography>
              <Typography
                sx={{
                  color: 'text.auxiliary',
                  width: 80,
                  textAlign: 'right',
                }}
              >
                Split
              </Typography>
            </Box>
          </Box>
          <Stack
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: 'border.strong',
            }}
          >
            {rewardsDistribution.map((percentage, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: 60,
                  flexShrink: 0,
                  px: 1.5,
                }}
              >
                <RewardPlace place={index + 1} />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <RewardAmount
                    percentage={percentage}
                    fundToken={fundToken}
                    fundAmount={Number(fundAmount)}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: 'neutral.100', width: 80, textAlign: 'right' }}
                  >
                    {percentage}%
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 64,
              px: 1.5,
            }}
          >
            <Typography variant="body1" sx={{ color: 'neutral.200' }}>
              <strong>{rewardsDistribution.length}</strong> positions
            </Typography>
            <Typography variant="body3" sx={{ color: 'neutral.100' }}>
              <FormattedNumber
                value={value}
                decimals={decimals}
                suffix={`${suffix} ${fundToken.toUpperCase()}`}
              />
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </ResponsiveOverlay>
  );
};

export default ViewDistributionDialog;
