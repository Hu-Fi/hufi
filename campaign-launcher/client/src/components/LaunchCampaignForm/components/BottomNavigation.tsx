import { type FC, type PropsWithChildren } from 'react';

import { Box, Button, Stack, useTheme } from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';

type Props = {
  handleNextClick: () => void;
  handleBackClick?: () => void;
  disableBackButton?: boolean;
  disableNextButton?: boolean;
  nextButtonText?: string;
  formId?: string;
};

const BottomNavigation: FC<PropsWithChildren<Props>> = ({
  handleNextClick,
  disableNextButton = false,
  disableBackButton = false,
  nextButtonText = 'Next',
  formId,
  handleBackClick,
  children,
}) => {
  const isMobile = useIsMobile();
  const theme = useTheme();

  const showBackButton = !!handleBackClick;

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
      alignItems="flex-end"
      justifyContent="space-between"
      mt="auto"
      gridArea="bottomNav"
      minHeight={{ xs: 95, md: 140 }}
      px={{ xs: 2, md: 0 }}
      py={{ xs: 3, md: 0 }}
      position={{ xs: 'fixed', md: 'static' }}
      left={{ xs: 0, md: 'auto' }}
      right={{ xs: 0, md: 'auto' }}
      bottom={{ xs: 0, md: 'auto' }}
      width={{ xs: '100%', md: 'auto' }}
      gap={{ xs: 0, md: 4 }}
      bgcolor={{ xs: 'background.default', md: 'transparent' }}
      borderTop={{ xs: '2px solid #251d47', md: 'none' }}
      sx={{
        zIndex: { xs: theme.zIndex.appBar, md: 'auto' },
      }}
    >
      {children}
      <Box
        display="flex"
        alignItems="center"
        flexDirection="row"
        gap={2}
        width={{ xs: '100%', md: 'auto' }}
        ml="auto"
      >
        {showBackButton && (
          <Button
            variant="outlined"
            size="large"
            fullWidth={isMobile}
            disabled={disableBackButton}
            sx={{ minWidth: 150, color: 'white', borderColor: '#433679' }}
            onClick={onBackClick}
          >
            {isMobile ? 'Back' : 'Previous'}
          </Button>
        )}
        <Button
          variant="contained"
          size="large"
          color="error"
          fullWidth={isMobile}
          type={formId ? 'submit' : 'button'}
          form={formId}
          disabled={disableNextButton}
          sx={{ minWidth: 150 }}
          onClick={formId ? undefined : onNextClick}
        >
          {nextButtonText}
        </Button>
      </Box>
    </Stack>
  );
};

export default BottomNavigation;
