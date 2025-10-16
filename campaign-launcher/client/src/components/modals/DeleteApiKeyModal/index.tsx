import type { FC } from 'react';

import { Button, Stack, Typography } from '@mui/material';

import { useDeleteApiKeyByExchange } from '../../../hooks/recording-oracle/exchangeApiKeys';
import { ModalLoading, ModalSuccess, ModalError } from '../../ModalState';
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

  const handleDelete = () => {
    deleteApiKey();
  };

  const handleClose = () => {
    if (isPending) return;

    resetMutation();
    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      sx={{
        color: 'text.primary',
        px: { xs: 3, md: 4 },
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
              You are about to delete an API KEY.
              <br />
              This action can&apos;t be undone, do you want to continue?
            </Typography>
            <Stack direction="row" justifyContent="center" gap={1}>
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
