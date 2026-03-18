import type { FC } from 'react';

import { Button, Stack } from '@mui/material';

import { ModalError } from '@/components/ModalState';
import { useIsMobile } from '@/hooks/useBreakpoints';

type Props = {
  onRetry: () => void;
};

const ErrorView: FC<Props> = ({ onRetry }) => {
  const isMobile = useIsMobile();

  return (
    <Stack alignItems="center" textAlign="center" p={2}>
      <ModalError message="Something went wrong, please try again." />
      <Button
        size="large"
        variant="outlined"
        fullWidth={isMobile}
        sx={{ mt: 4, mx: 'auto', color: 'white', borderColor: '#433679' }}
        onClick={onRetry}
      >
        Try again
      </Button>
    </Stack>
  );
};

export default ErrorView;
