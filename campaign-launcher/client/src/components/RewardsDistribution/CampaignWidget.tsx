import { useState, type FC } from 'react';

import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';

import { CardName } from '@/components/CampaignStats';
import FormattedNumber from '@/components/FormattedNumber';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { getCompactNumberParts, getOrdinalSuffix } from '@/utils';

import CampaignRewardsDialog from './CampaignRewardsDialog';
import { FirstPlaceIcon, SecondPlaceIcon, ThirdPlaceIcon } from './components';

const TOP_3_META = [
  {
    color: '#ffc628',
    background:
      'radial-gradient(375.56% 223.28% at 93.31% -161.44%, #FFC628 0%, #1B143A 100%)',
    outerBackground: 'linear-gradient(90deg, #FFE49B40 0%, #FFC628 100%)',
    icon: <FirstPlaceIcon />,
  },
  {
    color: '#b7add9',
    background:
      'radial-gradient(375.56% 223.28% at 93.31% -161.44%, #B7ADD9 0%, #1B143A 100%)',
    outerBackground: 'linear-gradient(90deg, #B7ADD940 0%, #B7ADD9 100%)',
    icon: <SecondPlaceIcon />,
  },
  {
    color: '#df8b39',
    background:
      'radial-gradient(375.56% 223.28% at 93.31% -161.44%, #DF8B39 0%, #1B143A 100%)',
    outerBackground: 'linear-gradient(90deg, #DF8B3940 0%, #DF8B39 100%)',
    icon: <ThirdPlaceIcon />,
  },
] as const;

const ViewAllButton = ({
  onClick,
  isMobile,
}: {
  onClick: () => void;
  isMobile: boolean;
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '-44px',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        width: { xs: 'calc(100% + 32px)', md: '100%' },
        height: 230,
        mx: { xs: -2, md: 0 },
      }}
    >
      <Box
        sx={{
          flex: 1,
          background:
            'linear-gradient(0deg, #251D47 0%, rgba(37, 29, 71, 0.00) 100%)',
        }}
      />
      <Button
        size="large"
        variant="outlined"
        fullWidth={!isMobile}
        sx={{
          color: 'neutral.100',
          borderColor: 'accent.main',
          ml: { xs: 2, md: 0 },
          mr: { xs: 2, md: 0 },
        }}
        onClick={onClick}
      >
        View All
      </Button>
    </Box>
  );
};

type Props = {
  data: number[];
  fundToken: string;
  fundAmount: number;
  userPosition: number | undefined;
};

const CampaignWidget: FC<Props> = ({
  data,
  fundToken,
  fundAmount,
  userPosition,
}) => {
  const [openAllRewardsDialog, setOpenAllRewardsDialog] = useState(false);

  const isMobile = useIsMobile();

  const totalPlaces = data.length;
  const limitPlaces = isMobile ? 7 : 11;
  const showViewAllButton = totalPlaces > limitPlaces;

  const userReward = userPosition
    ? (data[userPosition - 1] * fundAmount) / 100
    : undefined;

  return (
    <Stack
      sx={{
        mx: { xs: -2, md: 0 },
        px: { xs: 2, md: 0 },
        py: 3,
        borderBottom: '1px solid',
        borderColor: 'border.strong',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'border.main',
          py: { xs: 2, md: 3.5 },
          px: { xs: 2, md: 4 },
        }}
      >
        <CardName>Reward Distribution</CardName>
        {!!userPosition && (
          <Box
            sx={{
              mt: { xs: 2, md: 4 },
              pb: { xs: 0, md: 4 },
              borderBottom: { xs: 'none', md: '1px solid' },
              borderColor: { xs: 'unset', md: 'border.strong' },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                px: { xs: 1.5, md: 3 },
                gap: { xs: 1.5, md: 0 },
                bgcolor: 'primary.main',
                borderRadius: '8px',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'space-between', md: 'flex-start' },
                  gap: 4,
                  width: { xs: '100%', md: 'auto' },
                }}
              >
                <CardName
                  sx={{ color: { xs: 'background.paper', md: 'text.muted' } }}
                >
                  Your Position
                </CardName>
                <Typography
                  variant={isMobile ? 'h5' : 'h3'}
                  component="p"
                  sx={{ color: 'background.paper' }}
                >
                  #{userPosition}
                </Typography>
              </Box>
              {userPosition > totalPlaces ? (
                <Typography
                  variant={isMobile ? 'subtitle4' : 'body1'}
                  sx={{
                    color: 'background.paper',
                    width: { xs: '100%', md: 150 },
                    opacity: { xs: 0.7, md: 1 },
                  }}
                >
                  Not eligible for any rewards yet
                </Typography>
              ) : (
                <Stack
                  direction={{ xs: 'row', md: 'column' }}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    gap: { xs: 0.5, md: 0 },
                  }}
                >
                  <Typography
                    variant={isMobile ? 'subtitle4' : 'body1'}
                    sx={{ color: 'background.paper', opacity: 0.7 }}
                  >
                    Eligible for
                  </Typography>{' '}
                  <Typography
                    variant={isMobile ? 'subtitle3' : 'h5'}
                    component="p"
                    sx={{ color: 'background.paper' }}
                  >
                    <FormattedNumber
                      value={getCompactNumberParts(userReward as number).value}
                      decimals={
                        getCompactNumberParts(userReward as number).decimals
                      }
                      suffix={` ${fundToken}`}
                    />
                  </Typography>
                </Stack>
              )}
            </Box>
          </Box>
        )}
        <Stack sx={{ position: 'relative', mt: { xs: 2, md: 4 }, gap: 2 }}>
          <Grid container spacing={2}>
            {data.slice(0, 3).map((item, index) => {
              const { color, background, icon, outerBackground } =
                TOP_3_META[index];
              const { value, decimals } = getCompactNumberParts(
                (fundAmount * item) / 100
              );
              return (
                <Grid key={index} size={{ xs: index > 0 ? 6 : 12, md: 4 }}>
                  <Box
                    sx={{
                      p: '1px',
                      borderRadius: { xs: '8px', md: '16px' },
                      background: outerBackground, // emulating border with gradient
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        gap: { xs: 1.5, md: 2.5 },
                        background,
                        borderRadius: { xs: '8px', md: '16px' },
                        p: { xs: 1.5, md: 3 },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: { xs: 1, md: 2 },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 0.5, md: 1 },
                          }}
                        >
                          <Box
                            sx={{ '& svg': { fontSize: { xs: 16, md: 24 } } }}
                          >
                            {icon}
                          </Box>
                          <Typography
                            component="p"
                            variant={isMobile ? 'subtitle3' : 'h5'}
                            sx={{ color }}
                          >{`${index + 1}${getOrdinalSuffix(index + 1)} Place`}</Typography>
                        </Box>
                        <Typography
                          variant={isMobile ? 'subtitle3' : 'body4'}
                          sx={{ color: 'neutral.100', opacity: 0.7 }}
                        >
                          {item}%
                        </Typography>
                      </Box>
                      <Typography
                        component="p"
                        variant={isMobile ? 'body2' : 'h3'}
                        sx={{ color: 'neutral.100' }}
                      >
                        <FormattedNumber
                          value={value}
                          decimals={decimals}
                          suffix={` ${fundToken}`}
                        />
                      </Typography>
                    </Paper>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
          {!isMobile && (
            <Grid container spacing={2}>
              {data.slice(3, 11).map((item, index) => {
                const { value, decimals } = getCompactNumberParts(
                  (fundAmount * item) / 100
                );
                return (
                  <Grid key={index} size={{ xs: 12, md: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        py: 2.5,
                        bgcolor: 'background.subtle',
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: 'border.main',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: 3,
                        }}
                      >
                        <CardName>{`${index + 4}${getOrdinalSuffix(index + 4)} Place`}</CardName>
                        <Typography
                          variant="body4"
                          sx={{ color: 'neutral.100', opacity: 0.7 }}
                        >
                          {item}%
                        </Typography>
                      </Box>
                      <Typography
                        component="p"
                        variant="h4"
                        sx={{
                          mx: 'auto',
                          fontWeight: 700,
                          color: 'neutral.100',
                        }}
                      >
                        <FormattedNumber
                          value={value}
                          decimals={decimals}
                          suffix={` ${fundToken}`}
                        />
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
          {isMobile && (
            <Stack sx={{ mx: -2 }}>
              {data.slice(3, 7).map((item, index) => {
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
                      px: 2,
                      py: 1.5,
                      borderTop: '1px solid',
                      borderColor: 'border.strong',
                      '&:last-of-type': {
                        borderBottom: showViewAllButton ? 'none' : '1px solid',
                        borderBottomColor: showViewAllButton
                          ? 'unset'
                          : 'border.strong',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography sx={{ color: 'neutral.100' }}>
                        #{index + 4}
                      </Typography>
                      <Typography>
                        <FormattedNumber
                          value={value}
                          decimals={decimals}
                          suffix={` ${fundToken}`}
                        />
                      </Typography>
                    </Box>
                    <Stack>
                      <Typography sx={{ color: 'neutral.100' }}>
                        {item}%
                      </Typography>
                      <Typography variant="subtitle4">Split</Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
          {showViewAllButton && (
            <ViewAllButton
              onClick={() => setOpenAllRewardsDialog(true)}
              isMobile={isMobile}
            />
          )}
        </Stack>
        <Typography
          variant={isMobile ? 'body1' : 'body3'}
          component="p"
          sx={{ mt: showViewAllButton ? 10 : 4 }}
        >
          Participants finishing below {totalPlaces}
          {getOrdinalSuffix(totalPlaces)} place receive no reward from this
          campaign.
        </Typography>
      </Paper>
      <CampaignRewardsDialog
        open={openAllRewardsDialog}
        onClose={() => setOpenAllRewardsDialog(false)}
        data={data}
        fundToken={fundToken}
        fundAmount={fundAmount}
        userPosition={userPosition}
      />
    </Stack>
  );
};

export default CampaignWidget;
