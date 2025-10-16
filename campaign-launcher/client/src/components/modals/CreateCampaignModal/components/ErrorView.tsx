import type { FC } from 'react';

import { Button, Stack, Typography } from '@mui/material';

import { ModalError } from '../../../ModalState';

type Props = {
  onRetry: () => void;
};

const ErrorView: FC<Props> = ({ onRetry }) => {
  return (
    <Stack alignItems="center" textAlign="center">
      <Typography variant="h4" color="text.primary" mb={4}>
        Create Campaign
      </Typography>
      <ModalError />
      <Button
        size="large"
        variant="contained"
        sx={{ mt: 4, mx: 'auto' }}
        onClick={onRetry}
      >
        Try again
      </Button>
    </Stack>
  );
};

export default ErrorView;
