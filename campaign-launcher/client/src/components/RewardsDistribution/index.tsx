import { useEffect, useState, type FC } from 'react';

import { Box, Button, IconButton, Stack, Typography } from '@mui/material';

import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { useIsMobile } from '@/hooks/useBreakpoints';
import {
  DashboardSquareEditIcon,
  MinusIcon,
  PlusIcon,
  WarningIcon,
} from '@/icons';
import { getOrdinalSuffix } from '@/utils';

import { RewardAmount, RewardPlace } from './components';
import EditPositionsDialog from './EditPositionsDialog';

type Props = {
  open: boolean;
  onClose: () => void;
  data: number[];
  setData: (data: number[]) => void;
  fundAmount: number;
  fundToken: string;
};

const RewardsDistribution: FC<Props> = ({
  open,
  onClose,
  data,
  setData,
  fundAmount,
  fundToken,
}) => {
  const [draftData, setDraftData] = useState<number[]>(data);
  const [editPositionsDialogOpen, setEditPositionsDialogOpen] = useState(false);

  const isMobile = useIsMobile();

  const currentAllocatedPercentage = draftData.reduce(
    (acc, curr) => acc + curr,
    0
  );

  const rewardedPositionsCount = draftData.filter(Boolean).length;

  const isFullyAllocated = currentAllocatedPercentage === 100;

  useEffect(() => {
    if (data.length === 0) {
      setDraftData([40, 30, 20, 10]);
    }
  }, [data]);

  const handleDecreasePercentage = (index: number) => {
    if (currentAllocatedPercentage === 0) return;

    const newValue = Math.max(draftData[index] - 1, 0);

    if (newValue < draftData[index + 1] || newValue < 0) {
      return;
    }

    const newData = [...draftData];
    newData[index] = newValue;
    setDraftData(newData);
  };

  const handleIncreasePercentage = (index: number) => {
    if (isFullyAllocated) return;

    const newValue = Math.min(draftData[index] + 1, 100);

    if (newValue > draftData[index - 1] || newValue > 100) {
      return;
    }

    const newData = [...draftData];
    newData[index] = newValue;
    setDraftData(newData);
  };

  const handleEditPositions = (data: number[]) => {
    setDraftData(data);
  };

  const handleProceedWithDistribution = () => {
    setData(draftData.filter(Boolean));
    onClose();
  };

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      desktopSx={{
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        height: 670,
      }}
      mobileSx={{ p: 0, height: '90dvh', maxHeight: '700px' }}
    >
      <Stack
        sx={{
          gap: 2.5,
          px: { xs: 2, md: 4 },
          pt: { xs: 3, md: 6 },
          pb: { xs: 1, md: 3 },
          borderBottom: { xs: 'none', md: '1px solid' },
          borderColor: { xs: 'unset', md: 'border.strong' },
        }}
      >
        <Typography
          variant={isMobile ? 'body4' : 'h4'}
          sx={{ color: 'neutral.100' }}
        >
          Set reward distribution
        </Typography>
        <Typography variant="body1">
          Assign a % of the reward pool to each finishing rank
        </Typography>
      </Stack>
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, p: { xs: 2, md: 4 } }}>
        <Stack
          sx={{
            width: '100%',
            height: '100%',
            minHeight: 0,
            bgcolor: 'background.default',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'border.strong',
            overflow: 'hidden',
          }}
        >
          <Stack
            sx={{
              py: 2,
              px: 1.5,
              gap: 1.5,
              borderBottom: '1px solid',
              borderColor: 'border.strong',
            }}
          >
            <Box sx={{ display: 'flex' }}>
              {isFullyAllocated ? (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ color: 'success.main' }}
                >
                  100% allocated
                </Typography>
              ) : (
                <Typography variant="body1">
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ color: 'warning.main' }}
                  >
                    {`${100 - currentAllocatedPercentage}% unallocated. `}
                  </Typography>
                  <Typography component="span">
                    Must reach 100% to proceed
                  </Typography>
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '8px',
                borderRadius: '90px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'border.main',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${currentAllocatedPercentage}%`,
                  height: '100%',
                  borderRadius: '90px',
                  bgcolor: 'success.main',
                }}
              />
            </Box>
          </Stack>
          <Stack
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              py: 2,
              px: 1.5,
              gap: 1.5,
            }}
          >
            {draftData.map((percentage, index, array) => {
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: { xs: 1, md: 2 },
                  }}
                >
                  <RewardPlace place={index + 1} />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 1, md: 3 },
                    }}
                  >
                    <RewardAmount
                      percentage={percentage}
                      fundToken={fundToken}
                      fundAmount={fundAmount}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: '36px',
                        width: { xs: '110px', md: '120px' },
                        py: 0.5,
                        px: { xs: 1, md: 1.5 },
                        gap: 1,
                        bgcolor: 'background.paper',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: 'border.strong',
                      }}
                    >
                      <IconButton
                        sx={{
                          p: 0.5,
                          width: 24,
                          height: 24,
                          color: 'text.primary',
                        }}
                        disabled={
                          percentage < 1 ||
                          currentAllocatedPercentage === 0 ||
                          percentage - 1 < array[index + 1]
                        }
                        onClick={() => handleDecreasePercentage(index)}
                      >
                        <MinusIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="body2"
                          sx={{ color: 'neutral.100' }}
                        >
                          {percentage}%
                        </Typography>
                      </Box>

                      <IconButton
                        sx={{
                          p: 0.5,
                          width: 24,
                          height: 24,
                          color: 'text.primary',
                        }}
                        disabled={
                          percentage > 99 ||
                          isFullyAllocated ||
                          percentage + 1 > array[index - 1]
                        }
                        onClick={() => handleIncreasePercentage(index)}
                      >
                        <PlusIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Stack>
          <Stack sx={{ p: 1.5, pb: 2, gap: 1.5, alignItems: 'flex-start' }}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => setEditPositionsDialogOpen(true)}
            >
              <DashboardSquareEditIcon sx={{ fontSize: 16, mr: 1 }} />
              Edit positions
            </Button>
            <Typography
              variant="subtitle4"
              component="p"
              sx={{ color: 'text.auxiliary' }}
            >
              <WarningIcon
                sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'top' }}
              />
              Positions below {rewardedPositionsCount}
              {getOrdinalSuffix(rewardedPositionsCount)} place receive no
              rewards
            </Typography>
            <EditPositionsDialog
              open={editPositionsDialogOpen}
              onClose={() => setEditPositionsDialogOpen(false)}
              rewardsData={draftData}
              onSaveChanges={(data) => handleEditPositions(data)}
            />
          </Stack>
        </Stack>
      </Box>
      <Stack
        sx={{
          py: 3,
          px: 4,
          borderTop: '1px solid',
          borderColor: 'border.strong',
          height: 95,
        }}
      >
        <Button
          variant="contained"
          size="large"
          color="accent"
          fullWidth
          disabled={!isFullyAllocated}
          onClick={handleProceedWithDistribution}
        >
          Proceed with Distribution
        </Button>
      </Stack>
    </ResponsiveOverlay>
  );
};

export default RewardsDistribution;
