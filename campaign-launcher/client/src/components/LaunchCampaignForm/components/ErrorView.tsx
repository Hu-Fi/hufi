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
    <Stack
      sx={{
        alignItems: 'center',
        textAlign: 'center',
        p: 2,
      }}
    >
      <ModalError message="Something went wrong, please try again." />
      {!isMobile && (
        <Button
          size="large"
          variant="outlined"
          sx={{
            mt: 4,
            mx: 'auto',
            color: 'neutral.100',
            borderColor: 'border.strong',
          }}
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </Stack>
  );
};

export default ErrorView;
