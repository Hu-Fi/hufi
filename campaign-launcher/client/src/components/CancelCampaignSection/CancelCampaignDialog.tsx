import { useCallback, useState, type FC } from 'react';

import { EscrowClient } from '@human-protocol/sdk';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

import { ModalLoading, ModalSuccess } from '@/components/ModalState';
import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useNotification } from '@/hooks/useNotification';
import { WarningIcon } from '@/icons';
import { useSignerContext } from '@/providers/SignerProvider';
import { type Campaign } from '@/types';

type Props = {
  open: boolean;
  onClose: () => void;
  campaign: Campaign;
};

// TODO: Update the copy
const CancelCampaignDialog: FC<Props> = ({ open, onClose, campaign }) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const { isSignerReady, signer } = useSignerContext();
  const { showError } = useNotification();
  const queryClient = useQueryClient();

  const isIdle = !isCancelling && !isCancelled;

  const handleCancelCampaign = async () => {
    if (!isSignerReady || isCancelling) return;

    setIsCancelling(true);
    try {
      const client = await EscrowClient.build(signer);
      await client.requestCancellation(campaign.address);
      setIsCancelled(true);
      queryClient.invalidateQueries({
        queryKey: [
          QUERY_KEYS.CAMPAIGN_DETAILS,
          campaign.chain_id,
          campaign.address,
        ],
      });
    } catch (error) {
      console.error('Failed to cancel campaign', error);
      showError('Failed to cancel campaign');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClose = useCallback(() => {
    if (isCancelled) {
      setIsCancelled(false);
    }
    onClose();
  }, [onClose, isCancelled]);

  return (
    <ResponsiveOverlay
      open={open}
      onClose={handleClose}
      isLoading={isCancelling}
      desktopSx={{ px: 0, pt: 6, pb: 0 }}
      mobileSx={{ px: 0, pt: 3, pb: 0, height: '300px' }}
      closeButtonSx={{
        top: { xs: 24, md: 48 },
        right: { xs: 16, md: 32 },
      }}
    >
      <Stack px={{ xs: 2, md: 4 }} flex={1} minHeight={150}>
        <Typography
          variant="h5"
          display="flex"
          alignItems="center"
          color="white"
          fontSize={{ xs: 16, md: 24 }}
          fontWeight={700}
          lineHeight="100%"
          mb={3}
          gap={{ xs: 0.75, md: 1.5 }}
        >
          <WarningIcon
            sx={{ fontSize: { xs: 24, md: 32 }, color: '#cb3434' }}
          />
          Cancel Campaign
        </Typography>
        {isCancelling && <ModalLoading />}
        {isCancelled && (
          <Stack
            alignItems="center"
            textAlign="center"
            mx="auto"
            width="fit-content"
            gap={1}
          >
            <ModalSuccess>
              {/* TODO: we may need to update the docs and reference to the docs here */}
              <Typography variant="body1" py={1} mb={1} textAlign="center">
                Cancellation successfully requested. Updates might take a while.
              </Typography>
            </ModalSuccess>
          </Stack>
        )}
        {isIdle && (
          <Typography
            fontSize={{ xs: 14, md: 16 }}
            fontWeight={500}
            lineHeight="20px"
            mb={4}
          >
            Canceling this campaign will sit amet, consectetur adipiscing elit,
            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Ut enim ad minim veniam, quis nostrud exercitation
          </Typography>
        )}
      </Stack>
      <Box
        width="100%"
        py={{ xs: 2, md: 3 }}
        px={{ xs: 2, md: 4 }}
        borderTop="1px solid #3a2e6f"
      >
        {isCancelled && (
          <Button
            size="large"
            variant="contained"
            onClick={handleClose}
            sx={{ width: '100%', bgcolor: '#ff6262', color: 'white' }}
          >
            Close
          </Button>
        )}
        {!isCancelled && (
          <Button
            size="large"
            variant="contained"
            disabled={isCancelling}
            onClick={handleCancelCampaign}
            sx={{ width: '100%', bgcolor: '#ff6262', color: 'white' }}
          >
            Cancel Campaign
          </Button>
        )}
      </Box>
    </ResponsiveOverlay>
  );
};

export default CancelCampaignDialog;
