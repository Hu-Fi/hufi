import {
  useEffect,
  useState,
  type FC,
  type KeyboardEvent,
  type WheelEvent,
} from 'react';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';

import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { DashboardSquareEditIcon, WarningIcon } from '@/icons';
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

const formatPercentageInputs = (data: number[]) => data.map(String);

const isValidPercentageInput = (value: string) => {
  const maxPercentageInputLength = 3;
  const containsOnlyDigits = [...value].every(
    (char) => char >= '0' && char <= '9'
  );

  return (
    value.length <= maxPercentageInputLength &&
    containsOnlyDigits &&
    Number(value) <= 100
  );
};

const RewardsDistribution: FC<Props> = ({
  open,
  onClose,
  data,
  setData,
  fundAmount,
  fundToken,
}) => {
  const [rewardPercentages, setRewardPercentages] = useState<number[]>(data);
  const [draftPercentageInputs, setDraftPercentageInputs] = useState<string[]>(
    formatPercentageInputs(data)
  );
  const [editPositionsDialogOpen, setEditPositionsDialogOpen] = useState(false);

  const isMobile = useIsMobile();

  const currentAllocatedPercentage = rewardPercentages.reduce(
    (acc, curr) => acc + curr,
    0
  );

  const rewardedPositionsCount = rewardPercentages.filter(Boolean).length;

  const isFullyAllocated = currentAllocatedPercentage === 100;

  useEffect(() => {
    if (data.length === 0) {
      const defaultData = [40, 30, 20, 10];
      setRewardPercentages(defaultData);
      setDraftPercentageInputs(formatPercentageInputs(defaultData));
    }
  }, [data]);

  const getPercentageRange = (index: number) => {
    const previousPercentage = rewardPercentages[index - 1] ?? 100;
    const nextPercentage = rewardPercentages[index + 1] ?? 0;
    const allocatedWithoutCurrent =
      currentAllocatedPercentage - rewardPercentages[index];
    const maxByRemainingPool = 100 - allocatedWithoutCurrent;
    const min = nextPercentage;
    const max = Math.max(min, Math.min(previousPercentage, maxByRemainingPool));

    return { min, max };
  };

  const handleSetPercentage = (index: number, value: number) => {
    const { min, max } = getPercentageRange(index);
    const newValue = Math.min(Math.max(value, min), max);

    const newData = [...rewardPercentages];
    newData[index] = newValue;
    setRewardPercentages(newData);
    setDraftPercentageInputs(formatPercentageInputs(newData));
  };

  const handleChangePercentageInput = (index: number, value: string) => {
    if (!isValidPercentageInput(value)) {
      return;
    }

    const newInputs = [...draftPercentageInputs];
    newInputs[index] = value;
    setDraftPercentageInputs(newInputs);
  };

  const handleCommitPercentageInput = (index: number) => {
    const inputValue = draftPercentageInputs[index];

    if (!inputValue) {
      setDraftPercentageInputs(formatPercentageInputs(rewardPercentages));
      return;
    }

    const value = Number(inputValue);

    if (!Number.isFinite(value)) {
      setDraftPercentageInputs(formatPercentageInputs(rewardPercentages));
      return;
    }

    handleSetPercentage(index, value);
  };

  const handleEditPositions = (data: number[]) => {
    setRewardPercentages(data);
    setDraftPercentageInputs(formatPercentageInputs(data));
  };

  const handleProceedWithDistribution = () => {
    setData(rewardPercentages.filter(Boolean));
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
                  maxWidth: '100%',
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
            {rewardPercentages.map((percentage, index) => {
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
                    <TextField
                      value={draftPercentageInputs[index] ?? String(percentage)}
                      onChange={(event) =>
                        handleChangePercentageInput(index, event.target.value)
                      }
                      onBlur={() => handleCommitPercentageInput(index)}
                      slotProps={{
                        htmlInput: {
                          inputMode: 'numeric',
                          pattern: '[0-9]*',
                          onWheel: (event: WheelEvent<HTMLInputElement>) =>
                            event.currentTarget.blur(),
                          onKeyDown: (
                            event: KeyboardEvent<HTMLInputElement>
                          ) => {
                            if (event.key === 'Enter') {
                              event.currentTarget.blur();
                              return;
                            }

                            if (event.key === 'Escape') {
                              event.preventDefault();
                              setDraftPercentageInputs(
                                formatPercentageInputs(rewardPercentages)
                              );
                              return;
                            }

                            if (
                              event.key !== 'ArrowUp' &&
                              event.key !== 'ArrowDown'
                            ) {
                              return;
                            }

                            event.preventDefault();

                            const direction = event.key === 'ArrowUp' ? 1 : -1;
                            handleSetPercentage(index, percentage + direction);
                          },
                          sx: {
                            textAlign: 'left',
                          },
                        },
                        input: {
                          endAdornment: (
                            <Typography
                              variant="body2"
                              sx={{ color: 'text.secondary' }}
                            >
                              %
                            </Typography>
                          ),
                        },
                      }}
                      sx={{
                        width: 80,
                        '& .MuiInputBase-root': {
                          height: 32,
                          bgcolor: 'background.paper',
                          px: 1.5,
                        },
                        '& input': {
                          p: 0,
                          color: 'neutral.100',
                        },
                      }}
                    />
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
              rewardsData={rewardPercentages}
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
