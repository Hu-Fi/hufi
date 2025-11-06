import type { FC } from 'react';

import { Button, Stack, Typography } from '@mui/material';

import { ModalError } from '@/components/ModalState';
import { useIsMobile } from '@/hooks/useBreakpoints';

type Props = {
  onRetry: () => void;
};

const ErrorView: FC<Props> = ({ onRetry }) => {
  const isMobile = useIsMobile();

  return (
    <Stack alignItems="center" textAlign="center">
      <Typography variant="h4" color="text.primary" mb={4}>
        Create Campaign
      </Typography>
      <ModalError />
      <Button
        size="large"
        variant="contained"
        fullWidth={isMobile}
        sx={{ mt: 4, mx: 'auto' }}
        onClick={onRetry}
      >
        Try again
      </Button>
    </Stack>
  );
};

export default ErrorView;
