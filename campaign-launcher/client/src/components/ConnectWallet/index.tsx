import { type FC, useEffect, useState, type MouseEvent } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Button, Popover, Box, Typography, IconButton } from '@mui/material';
import { useConnect, useDisconnect, type Connector } from 'wagmi';

import coinbaseSvg from '@/assets/coinbase.svg';
import metaMaskSvg from '@/assets/metamask.svg';
import walletConnectSvg from '@/assets/walletconnect.svg';
import { useIsMobile } from '@/hooks/useBreakpoints';
import useRetrieveSigner from '@/hooks/useRetrieveSigner';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

import BaseModal from '../modals/BaseModal';

type Props = {
  closeDrawer?: () => void;
};

const WALLET_ICONS: Record<string, string> = {
  metaMask: metaMaskSvg,
  coinbaseWalletSDK: coinbaseSvg,
  walletConnect: walletConnectSvg,
};

const ConnectWallet: FC<Props> = ({ closeDrawer }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const { connectAsync, connectors } = useConnect();
  const { isConnecting } = useActiveAccount();
  const { disconnectAsync } = useDisconnect();
  const isMobile = useIsMobile();
  const { signer } = useRetrieveSigner();
  const { signIn, isLoading, isAuthorizing, setIsAuthorizing } = useWeb3Auth();

  const isDisabled = isLoading || isConnecting;

  const handleConnect = async (connector: Connector) => {
    try {
      setIsAuthorizing(true);
      await connectAsync({ connector });
    } catch (e) {
      const err = e as { message?: string; code?: number | string };
      if (err.message?.includes('Connector already connected')) {
        await disconnectAsync();
        await handleConnect(connector);
      }
      setIsAuthorizing(false);
    } finally {
      onClose();
    }
  };

  useEffect(() => {
    if (signer && isAuthorizing) {
      signIn();
    }
  }, [signer, signIn, isAuthorizing]);

  const handleConnectWalletButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return null;

    if (signer) {
      signIn();
    } else {
      setAnchorEl(e.currentTarget);
    }
  };

  const onClose = () => setAnchorEl(null);

  const renderContent = () => {
    return (
      <>
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          gap={1}
          mt={{ xs: 2, md: 0 }}
        >
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                bgcolor: 'rgba(255, 255, 255, 0.09)',
                color: 'text.primary',
                borderRadius: '4px',
              }}
              onClick={() => {
                handleConnect(connector);
                if (isMobile) {
                  onClose();
                  closeDrawer?.();
                }
              }}
            >
              <img
                src={connector.icon ?? WALLET_ICONS[connector.id]}
                alt={connector.id}
                width={24}
                height={24}
              />
              <span>{connector.name}</span>
            </Button>
          ))}
        </Box>
        <Typography color="text.primary" fontSize={11} mt={1.5}>
          By connecting a wallet, you agree to HUMAN Protocol Terms of Service
          and consent to its Privacy Policy.
        </Typography>
      </>
    );
  };

  return (
    <>
      <Button
        variant="contained"
        size={isMobile ? 'small' : 'large'}
        sx={{ color: 'primary.contrast', height: isMobile ? '30px' : '42px' }}
        disabled={isConnecting}
        onClick={handleConnectWalletButtonClick}
      >
        Connect Wallet
      </Button>
      {isMobile ? (
        <BaseModal
          open={!!anchorEl}
          onClose={onClose}
          elevation={4}
          sx={{ px: 2 }}
        >
          {renderContent()}
        </BaseModal>
      ) : (
        <Popover
          open={!!anchorEl}
          onClose={onClose}
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              elevation: 4,
              sx: {
                mt: 1,
                backgroundColor: 'background.default',
                boxShadow: '0px 0px 10px 0px rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                p: 2,
                width: '320px',
              },
            },
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            mb={2}
          >
            <IconButton
              sx={{ padding: 1, '&:hover': { bgcolor: 'unset' } }}
              onClick={() => setAnchorEl(null)}
            >
              <CloseIcon sx={{ color: 'primary.main' }} />
            </IconButton>
          </Box>
          {renderContent()}
        </Popover>
      )}
    </>
  );
};

export default ConnectWallet;
