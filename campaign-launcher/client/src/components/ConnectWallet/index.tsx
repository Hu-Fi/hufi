import { type FC, useEffect, useRef } from 'react';

import { useAppKit } from '@reown/appkit/react';
import { Button } from '@mui/material';
import { useConnection } from 'wagmi';

import { useIsMobile } from '@/hooks/useBreakpoints';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

const ConnectWallet: FC = () => {
  const { open } = useAppKit();
  const { isConnecting } = useActiveAccount();
  const { setShowSignInPrompt } = useWeb3Auth();
  const { isConnected } = useConnection();
  const isMobile = useIsMobile();
  const wasConnectedRef = useRef(isConnected);
  const promptOnNextConnectRef = useRef(false);

  useEffect(() => {
    if (
      isMobile &&
      !wasConnectedRef.current &&
      isConnected &&
      promptOnNextConnectRef.current
    ) {
      promptOnNextConnectRef.current = false;
      setShowSignInPrompt(true);
    }

    wasConnectedRef.current = isConnected;
  }, [isConnected, isMobile, setShowSignInPrompt]);

  const handleConnectWalletButtonClick = () => {
    if (isMobile) {
      promptOnNextConnectRef.current = true;
    }

    void open({ view: 'Connect' }).catch(() => {
      if (isMobile) {
        promptOnNextConnectRef.current = false;
      }
    });
  };

  return (
    <Button
      variant="contained"
      size={isMobile ? 'small' : 'large'}
      sx={{ color: 'primary.contrast', height: isMobile ? '30px' : '42px' }}
      disabled={isConnecting}
      onClick={handleConnectWalletButtonClick}
    >
      Connect Wallet
    </Button>
  );
};

export default ConnectWallet;
