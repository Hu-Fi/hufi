import { type FC } from 'react';

import { Button, Stack, Typography } from '@mui/material';

import { useDeleteApiKeyByExchange } from '@/hooks/recording-oracle/exchangeApiKeys';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { WarningIcon } from '@/icons';

import { ModalError, ModalLoading, ModalSuccess } from '../ModalState';
import ResponsiveOverlay from '../ResponsiveOverlay';

type Props = {
  open: boolean;
  onClose: () => void;
  exchangeName: string;
};

const DeleteApiKeyDialog: FC<Props> = ({ open, onClose, exchangeName }) => {
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
    if (isPending) return;
    resetMutation();
    onClose();
  };

  return (
    <ResponsiveOverlay
      open={open}
      onClose={handleClose}
      isLoading={isPending}
      desktopSx={{ py: 3, px: 8, height: 400 }}
      mobileSx={{ p: 3, height: '60dvh' }}
      closeButtonSx={{
        top: 24,
        right: 24,
      }}
    >
      <Stack
        mx="auto"
        alignItems="center"
        maxWidth={{ xs: '100%', md: 350 }}
        height="100%"
      >
        <WarningIcon sx={{ width: 60, height: 60, mb: 2 }} />
        <Typography variant="h6" mb={2} fontWeight={700}>
          Delete API key?
        </Typography>
        {isPending && <ModalLoading />}
        {isIdle && (
          <>
            <Typography
              variant="body1"
              textAlign="center"
              color="#a0a0a0"
              fontWeight={500}
            >
              You are about to delete an API KEY for{' '}
              <Typography
                variant="body1"
                color="text.primary"
                fontWeight={600}
                textTransform="capitalize"
                component="span"
              >
                {exchangeName}
              </Typography>
              . This action can&apos;t be undone and will end your participation
              in related campaigns.
              <br />
              You can update it instead.
            </Typography>
            <Typography variant="body1" color="#a0a0a0" my={3} fontWeight={500}>
              Do you want to continue?
            </Typography>
          </>
        )}
        {isSuccess && (
          <ModalSuccess>
            <Typography variant="subtitle2" py={1} mb={1} textAlign="center">
              You have successfully deleted your API KEY
            </Typography>
          </ModalSuccess>
        )}
        {isError && <ModalError message="Failed to delete API key." />}
        <Stack direction="row" gap={2} mt="auto">
          <Button
            variant="outlined"
            fullWidth={isMobile}
            disabled={isPending}
            onClick={handleClose}
            sx={{ color: 'white', borderColor: '#433679', minWidth: 135 }}
          >
            {isIdle ? 'Cancel' : 'Close'}
          </Button>
          {isIdle && (
            <Button
              variant="contained"
              fullWidth={isMobile}
              onClick={handleDelete}
              sx={{
                color: 'white',
                bgcolor: '#da4c4f',
                minWidth: 135,
                boxShadow: 'none',
              }}
            >
              Delete
            </Button>
          )}
        </Stack>
      </Stack>
    </ResponsiveOverlay>
  );
};

export default DeleteApiKeyDialog;
