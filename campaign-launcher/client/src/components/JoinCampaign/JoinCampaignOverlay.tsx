import { type FC, useState } from 'react';

import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { useConnect, useConnectors, useDisconnect } from 'wagmi';

import coinbasePng from '@/assets/coinbase.png';
import metaMaskPng from '@/assets/metamask.png';
import walletConnectPng from '@/assets/walletConnect.png';
import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useNotification } from '@/hooks/useNotification';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import { formatAddress } from '@/utils';

type JoinFlowStep = 'connect' | 'auth';

type Props = {
  open: boolean;
  onClose: () => void;
  startStep: JoinFlowStep;
};

const WALLET_ICONS: Record<string, string> = {
  metaMaskSDK: metaMaskPng,
  coinbaseWalletSDK: coinbasePng,
  walletConnect: walletConnectPng,
};

const JoinCampaignOverlay: FC<Props> = ({ open, onClose, startStep }) => {
  const [step, setStep] = useState<JoinFlowStep>(startStep);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>();

  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const { activeAddress } = useActiveAccount();
  const { signIn, isLoading: isAuthLoading } = useWeb3Auth();
  const { showError } = useNotification();
  const isMobile = useIsMobile();

  const selectedConnector = connectors.find(
    (connector) => connector.id === selectedConnectorId
  );

  const isOverlayActionLoading =
    connect.isPending || disconnect.isPending || isAuthLoading;

  const handleOverlayClose = () => {
    if (isOverlayActionLoading) return;
    onClose();
  };

  const handleConnectWallet = async () => {
    if (!selectedConnector) return;

    try {
      await connect.mutateAsync({ connector: selectedConnector });
      setStep('auth');
    } catch (error) {
      const err = error as { message?: string };
      if (err.message?.includes('Connector already connected')) {
        await disconnect.mutateAsync();
        await connect.mutateAsync({ connector: selectedConnector });
        setStep('auth');
        return;
      }
      showError('Failed to connect wallet');
    }
  };

  const handleAuthenticate = async () => {
    try {
      await signIn();
      onClose();
    } catch {
      showError('Failed to sign in');
    }
  };

  const isConnectStep = step === 'connect';
  const shouldShowTwoSteps = startStep === 'connect';

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
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            {Array.from({ length: 2 }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  height: 8,
                  width: 90,
                  borderRadius: 10,
                  bgcolor:
                    index === 0 || !isConnectStep ? 'text.primary' : '#3a2e6f',
                }}
              />
            ))}
          </Box>
        )}
        <Stack gap={1.5}>
          <Typography
            variant="body1"
            fontSize={{ xs: '16px', md: '20px' }}
            fontWeight={600}
            color="white"
          >
            {isConnectStep ? 'Connect Wallet' : 'Sign In'}
          </Typography>
          <Typography variant="subtitle2" color="text.primary" fontWeight={500}>
            {isConnectStep
              ? 'Connect your wallet to create, participate in campaigns and track your performance.'
              : 'To keep your account secure, please sign this message. This is a gasless way to confirm you own this address.'}
          </Typography>
        </Stack>
        {isConnectStep ? (
          <Grid container spacing={2} mt={2.5}>
            {connectors.map((connector) => {
              const isSelected = connector.id === selectedConnectorId;

              return (
                <Grid size={{ xs: 6 }} key={connector.id}>
                  <Button
                    fullWidth
                    onClick={() => setSelectedConnectorId(connector.id)}
                    sx={{
                      p: 2,
                      gap: 1.5,
                      minHeight: 136,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '8px',
                      color: 'white',
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : '#433679',
                      bgcolor: 'transparent',
                    }}
                  >
                    <img
                      src={connector.icon ?? WALLET_ICONS[connector.id]}
                      alt={connector.name}
                      width="auto"
                      height={44}
                    />
                    <Typography variant="body1" textAlign="center">
                      {connector.name}
                    </Typography>
                  </Button>
                </Grid>
              );
            })}
          </Grid>
        ) : (
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
        )}
        {isConnectStep ? (
          <Button
            variant="contained"
            size="large"
            color="error"
            fullWidth={isMobile}
            disabled={!selectedConnector || isOverlayActionLoading}
            sx={{ mt: 6 }}
            onClick={handleConnectWallet}
          >
            Connect Wallet
          </Button>
        ) : (
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
        )}
      </Stack>
    </ResponsiveOverlay>
  );
};

export default JoinCampaignOverlay;
