import type { FC } from 'react';

import { Button, Stack, Typography } from '@mui/material';

import {
  ModalError,
  ModalLoading,
  ModalSuccess,
} from '@/components/ModalState';
import { useDeleteApiKeyByExchange } from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';

import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
  exchangeName: string;
};

const DeleteApiKeyModal: FC<Props> = ({ open, onClose, exchangeName }) => {
  const {
    mutate: deleteApiKey,
    reset: resetMutation,
    isPending,
    isIdle,
    isSuccess,
    isError,
  } = useDeleteApiKeyByExchange(exchangeName);

  const isMobile = useIsMobile();

  const handleDelete = () => {
    deleteApiKey();
  };

  const handleClose = () => {
    resetMutation();
    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      isLoading={isPending}
      sx={{
        color: 'text.primary',
        px: { xs: 2, md: 4 },
      }}
    >
      <Stack textAlign="center" alignItems="center">
        <Typography variant="h4" py={1} mb={2}>
          Delete API key
        </Typography>
        {isPending && <ModalLoading />}
        {isIdle && (
          <>
            <Typography variant="subtitle2" py={1} mb={4} textAlign="center">
              You are about to delete an API KEY for{' '}
              <Typography
                variant="alert"
                color="warning"
                textTransform="capitalize"
              >
                {exchangeName}
              </Typography>
              .
              <br />
              This action can&apos;t be undone and will end your participation
              in related campaigns.
              <br />
              You can update it instead.
              <br />
              Do you want to continue?
            </Typography>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="center"
              gap={1}
              width={{ xs: '100%', sm: 'auto' }}
            >
              <Button variant="outlined" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleDelete}>
                Delete
              </Button>
            </Stack>
          </>
        )}
        {isSuccess && (
          <ModalSuccess>
            <Typography variant="subtitle2" py={1} mb={1} textAlign="center">
              You have successfully deleted your API KEY
            </Typography>
          </ModalSuccess>
        )}
        {isError && <ModalError />}
        {!isIdle && (
          <Button
            size="large"
            variant="contained"
            disabled={isPending}
            fullWidth={isMobile}
            onClick={handleClose}
          >
            Close
          </Button>
        )}
      </Stack>
    </BaseModal>
  );
};

export default DeleteApiKeyModal;
