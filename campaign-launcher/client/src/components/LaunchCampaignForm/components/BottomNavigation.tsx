import { type FC } from 'react';

import { Box, Button, Stack } from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';

import { StepsIndicator } from './';

type Props = {
  step: number;
  handleNextClick: () => void;
  disableNextButton?: boolean;
  disableBackButton?: boolean;
  nextButtonText?: string;
  nextButtonType?: 'button' | 'submit';
  handleBackClick?: () => void;
};

const BottomNavigation: FC<Props> = ({
  step,
  handleNextClick,
  disableNextButton = false,
  disableBackButton = false,
  nextButtonText = 'Next',
  nextButtonType = 'button',
  handleBackClick,
}) => {
  const isMobile = useIsMobile();

  const onBackClick = () => {
    if (disableBackButton) return;
    handleBackClick?.();
  };

  const onNextClick = () => {
    if (disableNextButton) return;
    handleNextClick?.();
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      width="100%"
      mt={{ xs: 8, md: 15 }}
    >
      {!isMobile && <StepsIndicator step={step} />}
      <Box
        display="flex"
        alignItems="center"
        flexDirection={{ xs: 'column', md: 'row' }}
        gap={2}
        width={{ xs: '100%', md: 'auto' }}
      >
        {step > 1 && (
          <Button
            variant="outlined"
            fullWidth={isMobile}
            disabled={disableBackButton}
            sx={{ minWidth: 150 }}
            onClick={onBackClick}
          >
            Back
          </Button>
        )}
        <Button
          variant="contained"
          fullWidth={isMobile}
          type={nextButtonType}
          disabled={disableNextButton}
          sx={{ minWidth: 150 }}
          onClick={nextButtonType === 'submit' ? undefined : onNextClick}
        >
          {nextButtonText}
        </Button>
      </Box>
    </Stack>
  );
};

export default BottomNavigation;
