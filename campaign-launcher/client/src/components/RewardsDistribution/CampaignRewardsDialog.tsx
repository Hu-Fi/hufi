import { type FC } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import FormattedNumber from '@/components/FormattedNumber';
import MyEntryLabel from '@/components/Leaderboard/MyEntryLabel';
import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { getCompactNumberParts, getOrdinalSuffix } from '@/utils';

const TOP_3_COLORS = [
  {
    color: '#ffc628',
    background: 'linear-gradient(90deg, #1B143A 0.18%, #765B33 124.85%)',
  },
  {
    color: '#b7add9',
    background: 'linear-gradient(90deg, #1B143A 0.16%, #B7ADD9 143.21%)',
  },
  {
    color: '#df8b39',
    background: 'linear-gradient(90deg, #1B143A 0.28%, #DF8B39 162.61%)',
  },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  data: number[];
  fundToken: string;
  fundAmount: number;
  userPosition: number | undefined;
};

const CampaignRewardsDialog: FC<Props> = ({
  open,
  onClose,
  data,
  fundToken,
  fundAmount,
  userPosition,
}) => {
  const isMobile = useIsMobile();

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      desktopSx={{
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        maxHeight: '600px',
      }}
      mobileSx={{
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        height: '80dvh',
      }}
      closeButtonSx={{ top: { xs: 32, md: 24 }, right: { xs: 32, md: 24 } }}
    >
      <Stack sx={{ flexShrink: 0, bgcolor: 'background.default', p: 4, pb: 3 }}>
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          sx={{ color: 'neutral.100' }}
        >
          Reward Distribution
        </Typography>
      </Stack>
      <Stack
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          '& > *': { flexShrink: 0 },
        }}
      >
        {data.map((item, index) => {
          const isTop3 = index < 3;
          const isMyEntry = userPosition === index + 1;
          const { value, decimals } = getCompactNumberParts(
            (fundAmount * item) / 100
          );
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 4,
                py: 1.5,
                height: '56px',
                borderBottom: '1px solid',
                borderColor: 'border.strong',
                background: isTop3 ? TOP_3_COLORS[index].background : 'inherit',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography
                  variant="body4"
                  sx={{
                    color: isTop3 ? TOP_3_COLORS[index].color : 'neutral.100',
                  }}
                >
                  #{index + 1}
                </Typography>
                <Typography sx={{ color: 'neutral.100' }}>
                  <FormattedNumber
                    value={value}
                    decimals={decimals}
                    suffix={` ${fundToken}`}
                  />
                </Typography>
                {isMyEntry && <MyEntryLabel />}
              </Box>
              <Stack>
                <Typography variant="body4" sx={{ color: 'neutral.100' }}>
                  {item}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.primary',
                    letterSpacing: '0px',
                    lineHeight: 'normal',
                  }}
                >
                  Split
                </Typography>
              </Stack>
            </Box>
          );
        })}
        {!!userPosition && userPosition > data.length && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 4,
                py: 1.5,
                height: '56px',
                borderBottom: '1px solid',
                borderColor: 'border.strong',
              }}
            >
              <Typography sx={{ color: 'neutral.100' }}>...</Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 4,
                py: 1.5,
                height: '56px',
                borderBottom: '1px solid',
                borderColor: 'border.strong',
                bgcolor: 'border.strong',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography
                  variant="body4"
                  sx={{
                    color: 'neutral.100',
                  }}
                >
                  #{userPosition}
                </Typography>
                <Typography sx={{ color: 'neutral.100' }}>
                  <FormattedNumber
                    value={0}
                    decimals={0}
                    suffix={` ${fundToken}`}
                  />
                </Typography>
                <MyEntryLabel />
              </Box>
              <Typography>Not eligible</Typography>
            </Box>
          </>
        )}
      </Stack>
      <Typography sx={{ m: 4, opacity: 0.6 }}>
        Participants finishing below{' '}
        {`${data.length}${getOrdinalSuffix(data.length)}`} place receive no
        reward from this campaign.
      </Typography>
    </ResponsiveOverlay>
  );
};

export default CampaignRewardsDialog;
