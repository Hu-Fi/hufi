import { useCallback, useState, type FC } from 'react';

import { EscrowClient } from '@human-protocol/sdk/dist/escrow';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

import { ModalLoading, ModalSuccess } from '@/components/ModalState';
import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useNotification } from '@/hooks/useNotification';
import { WarningIcon } from '@/icons';
import { useSignerContext } from '@/providers/SignerProvider';
import { CampaignStatus, type Campaign } from '@/types';

type Props = {
  open: boolean;
  onClose: () => void;
  campaign: Campaign;
};

const CancelCampaignDialog: FC<Props> = ({ open, onClose, campaign }) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const { isSignerReady, signer } = useSignerContext();
  const { showError } = useNotification();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const isIdle = !isCancelling && !isCancelled;

  const handleCancelCampaign = async () => {
    if (!isSignerReady || isCancelling) return;

    setIsCancelling(true);
    try {
      const client = await EscrowClient.build(signer);
      await client.requestCancellation(campaign.address);
      setIsCancelled(true);
      queryClient.setQueryData(
        [QUERY_KEYS.CAMPAIGN_DETAILS, campaign.chain_id, campaign.address],
        (old: Campaign | undefined) => ({
          ...(old ?? campaign),
          status: CampaignStatus.TO_CANCEL,
        })
      );
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
      mobileSx={{ px: 0, pt: 3, pb: 0, height: '350px' }}
      closeButtonSx={{
        top: { xs: 24, md: 48 },
        right: { xs: 16, md: 32 },
      }}
    >
      <Stack
        sx={{
          px: { xs: 2, md: 4 },
          flex: 1,
          minHeight: 200,
        }}
      >
        <Typography
          variant={isMobile ? 'body3' : 'h4'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'neutral.100',
            mb: 3,
            gap: { xs: 0.75, md: 1.5 },
          }}
        >
          <WarningIcon
            sx={{ fontSize: { xs: 24, md: 32 }, color: 'error.main' }}
          />
          Cancel Campaign
        </Typography>
        {isCancelling && (
          <Box sx={{ display: 'flex', my: 'auto' }}>
            <ModalLoading />
          </Box>
        )}
        {isCancelled && (
          <Stack
            sx={{
              alignItems: 'center',
              textAlign: 'center',
              mx: 'auto',
              width: 'fit-content',
              gap: 1,
            }}
          >
            <ModalSuccess>
              {/* TODO: we may need to update the docs and reference to the docs here */}
              <Typography
                variant="body3"
                sx={{
                  py: 1,
                  mb: 1,
                  textAlign: 'center',
                }}
              >
                Cancellation successfully requested. Updates might take a while.
              </Typography>
            </ModalSuccess>
          </Stack>
        )}
        {isIdle && (
          <Typography variant={isMobile ? 'body1' : 'body3'} sx={{ mb: 4 }}>
            Cancelling this campaign will immediately stop it from being shown
            as active. All user activity will no longer be recorded. Results
            will be calculated up to the point of cancellation, and any earned
            rewards will be distributed accordingly. Any remaining funds will be
            returned to the creator's wallet address.
          </Typography>
        )}
      </Stack>
      <Box
        sx={{
          width: '100%',
          py: { xs: 2, md: 3 },
          px: { xs: 2, md: 4 },
          borderTop: '1px solid',
          borderColor: 'border.strong',
        }}
      >
        {isCancelled ? (
          <Button
            size="large"
            variant="contained"
            color="accent"
            fullWidth
            onClick={handleClose}
          >
            Close
          </Button>
        ) : (
          <Button
            size="large"
            variant="contained"
            color="error"
            fullWidth
            disabled={isCancelling}
            onClick={handleCancelCampaign}
          >
            Cancel Campaign
          </Button>
        )}
      </Box>
    </ResponsiveOverlay>
  );
};

export default CancelCampaignDialog;
