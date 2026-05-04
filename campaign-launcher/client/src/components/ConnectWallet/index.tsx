import { type FC, useEffect, useRef } from 'react';

import { Button, type ButtonProps } from '@mui/material';
import { useAppKit, useAppKitState } from '@reown/appkit/react';
import { useConnection, useDisconnect } from 'wagmi';

import { useIsMobile } from '@/hooks/useBreakpoints';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

type ConnectWalletProps = {
  size?: ButtonProps['size'];
};

const ConnectWallet: FC<ConnectWalletProps> = ({ size = 'large' }) => {
  const { open } = useAppKit();
  const { open: isAppKitOpen } = useAppKitState();
  const { isConnecting } = useActiveAccount();
  const { setShowSignInPrompt } = useWeb3Auth();
  const { isConnected } = useConnection();
  const { mutate: disconnect } = useDisconnect();
  const isMobile = useIsMobile();
  const wasConnectedRef = useRef(isConnected);
  const appKitSessionStartedRef = useRef(false);
  const appKitModalWasOpenRef = useRef(false);
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

  useEffect(() => {
    if (isAppKitOpen) {
      appKitModalWasOpenRef.current = true;
      return;
    }

    if (
      !appKitSessionStartedRef.current ||
      !appKitModalWasOpenRef.current ||
      isConnected
    ) {
      return;
    }

    appKitSessionStartedRef.current = false;
    appKitModalWasOpenRef.current = false;
    promptOnNextConnectRef.current = false;

    if (isConnecting) {
      disconnect();
    }
  }, [disconnect, isAppKitOpen, isConnected, isConnecting]);

  const handleConnectWalletButtonClick = () => {
    appKitSessionStartedRef.current = true;

    if (isMobile) {
      promptOnNextConnectRef.current = true;
    }

    void open({ view: 'Connect' }).catch(() => {
      appKitSessionStartedRef.current = false;
      appKitModalWasOpenRef.current = false;

      if (isMobile) {
        promptOnNextConnectRef.current = false;
      }
    });
  };

  return (
    <Button
      variant="contained"
      size={size}
      sx={{ color: 'primary.contrast', height: isMobile ? '30px' : '42px' }}
      disabled={isConnecting}
      onClick={handleConnectWalletButtonClick}
    >
      Connect Wallet
    </Button>
  );
};

export default ConnectWallet;
