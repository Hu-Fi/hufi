import { FC, useEffect, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Button, Popover, Box, Typography, IconButton } from '@mui/material';
import { useAccount, useConnect } from 'wagmi';

import coinbaseSvg from '../../assets/coinbase.svg';
import metaMaskSvg from '../../assets/metamask.svg';
import walletConnectSvg from '../../assets/walletconnect.svg';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';

const WALLET_ICONS: Record<string, string> = {
  metaMask: metaMaskSvg,
  coinbaseWalletSDK: coinbaseSvg,
  walletConnect: walletConnectSvg,
};

const SignInButton: FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const { connect, connectors } = useConnect();
  const { isConnected, address } = useAccount();
  const { signIn } = useWeb3Auth();

  const onClose = () => setAnchorEl(null);

  useEffect(() => { 
    if (isConnected && address) {
      console.log('0', address);
      signIn(address);
    }
  }, [isConnected, address]);

  return (
    <>
      <Button
        variant="contained"
        size="large"
        sx={{ color: 'primary.contrast', fontWeight: 600 }}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        Sign In
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
                connect({ connector });
                onClose();
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

export default SignInButton;