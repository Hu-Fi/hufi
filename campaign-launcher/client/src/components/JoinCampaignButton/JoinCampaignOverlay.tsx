import { type FC, useEffect, useState } from 'react';

import { Box, Button, Stack, Typography } from '@mui/material';

import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { useNotification } from '@/hooks/useNotification';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useAuthedUserData } from '@/providers/AuthedUserData';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import { formatAddress } from '@/utils';

type JoinFlowStep = 'connect' | 'auth';

type Props = {
  open: boolean;
  onClose: () => void;
  startStep: JoinFlowStep;
  handleJoinCampaign: () => Promise<void>;
};

const JoinCampaignOverlay: FC<Props> = ({
  open,
  onClose,
  startStep,
  handleJoinCampaign,
}) => {
  const [isStartedJoinFlow, setIsStartedJoinFlow] = useState(false);

  const { activeAddress } = useActiveAccount();
  const { signIn, isLoading: isAuthLoading } = useWeb3Auth();
  const { enrolledExchanges } = useAuthedUserData();
  const { showError } = useNotification();

  const isOverlayActionLoading = isAuthLoading;
  const shouldShowTwoSteps = startStep === 'connect';

  const handleOverlayClose = () => {
    if (isOverlayActionLoading) return;
    onClose();
  };

  const handleAuthenticate = async () => {
    if (isOverlayActionLoading) return;

    setIsStartedJoinFlow(true);
    try {
      await signIn();
      onClose();
    } catch {
      setIsStartedJoinFlow(false);
      showError('Failed to sign in');
      return;
    }
  };

  useEffect(() => {
    const _handleJoinCampaign = async () => {
      try {
        await handleJoinCampaign();
      } finally {
        setIsStartedJoinFlow(false);
      }
    };

    if (isStartedJoinFlow && Array.isArray(enrolledExchanges)) {
      _handleJoinCampaign();
    }
  }, [isStartedJoinFlow, enrolledExchanges, handleJoinCampaign]);

  return (
    <ResponsiveOverlay
      open={open}
      onClose={handleOverlayClose}
      isLoading={isOverlayActionLoading}
      desktopSx={{
        px: 4,
        py: 4,
        maxWidth: 560,
        width: '100%',
      }}
      mobileSx={{ px: 2, py: 4 }}
      closeButtonSx={{
        top: shouldShowTwoSteps ? 24 : 32,
        right: { xs: 16, md: 32 },
      }}
    >
      <Stack>
        {shouldShowTwoSteps && (
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              gap: 1,
              mb: 2,
            }}
          >
            {Array.from({ length: 2 }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  bgcolor: 'text.primary',
                  borderRadius: 10,
                  height: 8,
                  width: 90,
                }}
              />
            ))}
          </Box>
        )}
        <Stack sx={{ gap: 1.5 }}>
          <Typography
            variant="body1"
            sx={{
              color: 'white',
              fontSize: { xs: '16px', md: '20px' },
              fontWeight: 600,
            }}
          >
            Sign In
          </Typography>
          <Typography variant="subtitle2" color="text.primary" fontWeight={500}>
            To keep your account secure, please sign this message. This is a
            gasless way to confirm you own this address.
          </Typography>
        </Stack>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={2}
          py={2}
          px={1.5}
          border="1px solid #433679"
          borderRadius="8px"
        >
          <Typography variant="body1">Connected Wallet</Typography>
          <Typography color="text.primary" fontWeight={600}>
            {formatAddress(activeAddress)}
          </Typography>
        </Box>
        <Stack direction="row" gap={2} mt={6}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            disabled={isOverlayActionLoading}
            onClick={onClose}
            sx={{
              color: 'white',
              borderColor: '#433679',
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="large"
            color="error"
            fullWidth
            disabled={isOverlayActionLoading}
            onClick={handleAuthenticate}
          >
            Sign In
          </Button>
        </Stack>
      </Stack>
    </ResponsiveOverlay>
  );
};

export default JoinCampaignOverlay;
