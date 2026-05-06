import { type FC, useState, type MouseEvent } from 'react';

import { Button, Grid, Typography } from '@mui/material';
import {
  useConnect,
  useConnectors,
  useDisconnect,
  type Connector,
} from 'wagmi';

import coinbasePng from '@/assets/coinbase.png';
import metaMaskPng from '@/assets/metamask.png';
import walletConnectPng from '@/assets/walletConnect.png';
import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { ConnectWalletIcon } from '@/icons';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

const WALLET_ICONS: Record<string, string> = {
  metaMaskSDK: metaMaskPng,
  coinbaseWalletSDK: coinbasePng,
  walletConnect: walletConnectPng,
};

type Props = {
  size?: 'small' | 'medium' | 'large';
  handleClickCallback?: () => void;
};

const ConnectWallet: FC<Props> = ({ size = 'large', handleClickCallback }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const { isConnecting } = useActiveAccount();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const { setShowSignInPrompt } = useWeb3Auth();
  const isMobile = useIsMobile();

  const handleConnectWalletButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
    handleClickCallback?.();
  };

  const onClose = () => setAnchorEl(null);

  const handleConnect = async (connector: Connector) => {
    try {
      await connect.mutateAsync({ connector });
      if (isMobile) {
        setShowSignInPrompt(true);
      }
    } catch (e) {
      const err = e as { message?: string; code?: number | string };
      if (err.message?.includes('Connector already connected')) {
        await disconnect.mutateAsync();
        await handleConnect(connector);
      }
    } finally {
      onClose();
    }
  };

  return (
    <>
      <Button
        variant="contained"
        size={size}
        color="error"
        disabled={isConnecting}
        onClick={handleConnectWalletButtonClick}
        sx={{
          color: 'white',
          width: 'fit-content',
          fontSize: 12,
          gap: 1,
        }}
      >
        <ConnectWalletIcon sx={{ fill: 'none', width: 18, height: 18 }} />
        Connect Wallet
      </Button>
      <ResponsiveOverlay
        open={!!anchorEl}
        onClose={onClose}
        desktopSx={{ height: 400 }}
        mobileSx={{ p: 2 }}
      >
        <Typography
          variant="h6"
          component="h6"
          sx={{
            color: 'white',
            mb: 1.5,
          }}
        >
          Connect Wallet
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 3,
            fontWeight: 500,
          }}
        >
          Connect your wallet to create, participate in campaigns and even track
          your performance on the leaderboard.
        </Typography>
        <Grid container spacing={2}>
          {connectors.map((connector) => (
            <Grid size={{ xs: 6, md: 4 }} key={connector.id}>
              <Button
                key={connector.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  height: '150px',
                  p: { xs: 3, md: 2 },
                  gap: 2,
                  bgcolor: 'transparent',
                  borderRadius: '8px',
                  border: '1px solid #433679',
                }}
                onClick={() => {
                  handleConnect(connector);
                }}
              >
                <img
                  src={connector.icon ?? WALLET_ICONS[connector.id]}
                  alt={connector.id}
                  width="auto"
                  height={58}
                />
                <Typography variant="body1" sx={{ color: 'white' }}>
                  {connector.name}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>
      </ResponsiveOverlay>
    </>
  );
};

export default ConnectWallet;
