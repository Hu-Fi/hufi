import { type FC, type PropsWithChildren } from 'react';

import { Box, Button, Stack } from '@mui/material';

import { MOBILE_BOTTOM_NAV_HEIGHT } from '@/constants';
import { useIsMobile } from '@/hooks/useBreakpoints';

type Props = {
  handleNextClick: () => void;
  handleBackClick?: () => void;
  disableBackButton?: boolean;
  disableNextButton?: boolean;
  nextButtonText?: string;
  formId?: string;
};

const Wrapper = ({
  isMobile,
  children,
}: {
  isMobile: boolean;
  children: React.ReactNode;
}) => {
  if (isMobile) {
    return (
      <Stack
        direction="row"
        alignItems="flex-end"
        justifyContent="space-between"
        height={`${MOBILE_BOTTOM_NAV_HEIGHT}px`}
        px={2}
        py={3}
        position="fixed"
        left="0"
        right="0"
        bottom={{ xs: 0, md: 'auto' }}
        width="100%"
        bgcolor="background.default"
        borderTop="2px solid #251d47"
        sx={{
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        {children}
      </Stack>
    );
  }
  return (
    <Stack
      direction="row"
      alignItems="flex-end"
      justifyContent="space-between"
      mt="auto"
      gridArea="bottomNav"
      minHeight={140}
      width="auto"
      gap={4}
      bgcolor="transparent"
    >
      {children}
    </Stack>
  );
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
    <Wrapper isMobile={isMobile}>
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
    </Wrapper>
  );
};

export default BottomNavigation;
