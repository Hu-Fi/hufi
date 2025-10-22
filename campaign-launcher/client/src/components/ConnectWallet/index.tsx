import { type FC, useEffect, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Button, Popover, Box, Typography, IconButton } from '@mui/material';
import { useAccount, useConnect, useDisconnect, type Connector } from 'wagmi';

import coinbaseSvg from '@/assets/coinbase.svg';
import metaMaskSvg from '@/assets/metamask.svg';
import walletConnectSvg from '@/assets/walletconnect.svg';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';

const WALLET_ICONS: Record<string, string> = {
  metaMask: metaMaskSvg,
  coinbaseWalletSDK: coinbaseSvg,
  walletConnect: walletConnectSvg,
};

const ConnectWallet: FC<{ closeDrawer?: () => void }> = ({ closeDrawer }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { connectAsync, connectors } = useConnect();
  const { address } = useAccount();
  const { setActiveAddress } = useActiveAccount();
  const { disconnectAsync } = useDisconnect();
  const isMobile = useIsMobile();

  const handleConnect = async (connector: Connector) => {
    console.log('Starting connection...', { connector: connector.id });
    setIsConnecting(true);
    try {
      console.log('Calling connectAsync...');
      await connectAsync({ connector });
      console.log('connectAsync completed successfully');
    } catch (e) {
      console.error('Connection error:', e);
      const err = e as { message?: string; code?: number | string };
      if (err.message?.includes('Connector already connected')) {
        await disconnectAsync();
        await handleConnect(connector);
      }
      const message = (err?.message ?? '').toLowerCase();
      const code = err?.code;
      const isUserAborted =
        code === 4001 ||
        message.includes('user rejected') ||
        message.includes('user denied') ||
        message.includes('modal closed') ||
        message.includes('request reset') ||
        message.includes('action rejected');
      if (isUserAborted) {
        console.log('User aborted connection');
        setIsConnecting(false);
      }
    } finally {
      console.log('Connection attempt finished, closing modal');
      onClose();
    }
  };

  const handleConnectWalletButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(e.currentTarget);
  };

  useEffect(() => {
    console.log('Address or connecting state changed:', {
      address,
      isConnecting,
    });

    if (address && isConnecting) {
      console.log('Setting active address:', address);
      setActiveAddress(address);
      setIsConnecting(false);
      console.log('Reset connecting state');
    }
  }, [address, setActiveAddress, isConnecting]);

  const onClose = () => setAnchorEl(null);

  console.log('isConnecting', isConnecting);

  return (
    <>
      <Button
        variant="contained"
        size="large"
        sx={{ color: 'primary.contrast' }}
        disabled={!!isConnecting}
        onClick={handleConnectWalletButtonClick}
      >
        Connect Wallet
      </Button>
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
        <Box width="100%" display="flex" flexDirection="column" gap={1}>
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
      </Popover>
    </>
  );
};

export default ConnectWallet;
