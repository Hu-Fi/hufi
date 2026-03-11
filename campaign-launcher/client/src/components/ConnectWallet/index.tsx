import { type FC, useState, type MouseEvent } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import {
  Button,
  Popover,
  Box,
  Grid,
  Typography,
  IconButton,
  Drawer,
} from '@mui/material';
import {
  useConnect,
  useConnectors,
  useDisconnect,
  type Connector,
} from 'wagmi';

import coinbasePng from '@/assets/coinbase.png';
import metaMaskPng from '@/assets/metamask.png';
import walletConnectPng from '@/assets/walletConnect.png';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { ConnectWalletIcon } from '@/icons';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

const WALLET_ICONS: Record<string, string> = {
  metaMaskSDK: metaMaskPng,
  coinbaseWalletSDK: coinbasePng,
  walletConnect: walletConnectPng,
};

const Content: FC<{ onClose: () => void }> = ({ onClose }) => {
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const { setShowSignInPrompt } = useWeb3Auth();
  const isMobile = useIsMobile();

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
    <Grid container spacing={2}>
      {connectors.map((connector) => (
        <Grid size={{ xs: 6, md: 6 }} key={connector.id}>
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
            <Typography variant="body1" color="white">
              {connector.name}
            </Typography>
          </Button>
        </Grid>
      ))}
    </Grid>
  );
};

type Props = {
  size?: 'small' | 'medium' | 'large';
  handleClickCallback?: () => void;
};

const ConnectWallet: FC<Props> = ({ size = 'large', handleClickCallback }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const { isConnecting } = useActiveAccount();
  const isMobile = useIsMobile();

  const handleConnectWalletButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
    handleClickCallback?.();
  };

  const onClose = () => setAnchorEl(null);

  return (
    <>
      <Button
        variant="contained"
        size={size}
        color="error"
        sx={{
          color: 'white',
          width: 'fit-content',
          fontSize: 12,
          gap: 1,
        }}
        disabled={isConnecting}
        onClick={handleConnectWalletButtonClick}
      >
        <ConnectWalletIcon sx={{ fill: 'none', width: 18, height: 18 }} />
        Connect Wallet
      </Button>
      {isMobile ? (
        <Drawer
          open={!!anchorEl}
          onClose={onClose}
          anchor="bottom"
          slotProps={{
            backdrop: {
              sx: {
                backdropFilter: 'blur(7px)',
                background: 'rgba(0, 0, 0, 0.3)',
              },
            },
            paper: {
              elevation: 0,
              sx: {
                p: 2,
                bgcolor: '#251d47',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                border: 'none',
              },
            },
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              p: 0,
            }}
          >
            <CloseIcon sx={{ color: 'white', size: 16 }} />
          </IconButton>
          <Typography variant="h6" component="h6" color="white" mb={1.5}>
            Connect Wallet
          </Typography>
          <Typography variant="body2" mb={3} fontWeight={500}>
            Connect your wallet to create, participate in campaigns and even
            track your performance on the leaderboard.
          </Typography>
          <Content onClose={onClose} />
        </Drawer>
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
                width: '380px',
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
          <Content onClose={onClose} />
        </Popover>
      )}
    </>
  );
};

export default ConnectWallet;
