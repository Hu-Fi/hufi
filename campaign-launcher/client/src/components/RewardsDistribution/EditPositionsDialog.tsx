import { useEffect, useMemo, useState, type FC } from 'react';

import { Box, Button, IconButton, Stack, Typography } from '@mui/material';

import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { TrashIcon } from '@/icons';

import { RewardPlace } from './components';

type Props = {
  open: boolean;
  onClose: () => void;
  rewardsData: number[];
  onSaveChanges: (data: number[]) => void;
};

const isTwoArraysEqual = (arr1: number[], arr2: number[]) => {
  if (arr1.length !== arr2.length) return false;

  return arr1.every((value, index) => value === arr2[index]);
};

const EditPositionsDialog: FC<Props> = ({
  open,
  onClose,
  rewardsData,
  onSaveChanges,
}) => {
  const [draftData, setDraftData] = useState(rewardsData);

  const isMobile = useIsMobile();

  useEffect(() => {
    setDraftData(rewardsData);
  }, [rewardsData]);

  const isDataChanged = useMemo(() => {
    return !isTwoArraysEqual(draftData, rewardsData);
  }, [draftData, rewardsData]);

  const handleAddPosition = () => {
    setDraftData([...draftData, 0]);
  };

  const handleDeletePosition = (index: number) => {
    setDraftData(draftData.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    setDraftData(rewardsData);
    onClose();
  };

  const handleSaveChanges = () => {
    onClose();
    onSaveChanges(draftData);
  };

  return (
    <ResponsiveOverlay
      open={open}
      onClose={handleCancel}
      desktopSx={{
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        height: 550,
      }}
      mobileSx={{ p: 0, height: '80dvh' }}
    >
      <Stack sx={{ flex: 1, minHeight: 0, pt: { xs: 2.5, md: 6 } }}>
        <Stack
          sx={{
            px: { xs: 2, md: 4 },
            pb: 3,
            gap: { xs: 2.5, md: 4 },
            flex: 1,
            minHeight: 0,
          }}
        >
          <Typography
            component="h4"
            variant={isMobile ? 'body4' : 'h4'}
            sx={{ color: 'neutral.100' }}
          >
            Edit positions
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
            <Stack
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                px: 1.5,
                py: 2,
                gap: 1.5,
              }}
            >
              {draftData.map((data, index) => (
                <Box key={index} sx={{ display: 'flex' }}>
                  <RewardPlace place={index + 1} />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 90,
                      height: 36,
                      ml: 3,
                      bgcolor: 'background.paper',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: 'border.strong',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'neutral.100',
                      }}
                    >
                      {data}%
                    </Typography>
                  </Box>
                  <IconButton
                    sx={{
                      p: 0.5,
                      width: 36,
                      height: 36,
                      ml: 'auto',
                      color: 'error.main',
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'border.strong',
                      borderRadius: '4px',
                    }}
                    disabled={draftData.length === 1}
                    onClick={() => handleDeletePosition(index)}
                  >
                    <TrashIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 'auto',
                py: 1.5,
                borderTop: '1px solid',
                borderColor: 'border.strong',
              }}
            >
              <Button
                variant="outlined"
                size="large"
                fullWidth
                sx={{ width: 170, borderRadius: '99px' }}
                onClick={handleAddPosition}
              >
                + Add position
              </Button>
            </Box>
          </Stack>
        </Stack>
        <Box
          sx={{
            display: 'flex',
            mt: 'auto',
            py: 3,
            px: { xs: 2, md: 4 },
            gap: { xs: 2, md: 3 },
            height: 95,
            borderTop: '1px solid',
            borderColor: 'border.strong',
          }}
        >
          <Button
            variant="outlined"
            size="large"
            fullWidth
            sx={{ flex: 1, color: 'neutral.100', borderColor: 'border.strong' }}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="large"
            color="accent"
            fullWidth
            disabled={!isDataChanged}
            sx={{ flex: 1 }}
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Stack>
    </ResponsiveOverlay>
  );
};

export default EditPositionsDialog;
