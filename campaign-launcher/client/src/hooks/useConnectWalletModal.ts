import { useCallback, useEffect, useRef, useState } from 'react';

import { useConnection, useDisconnect } from 'wagmi';

import { useIsMobile } from '@/hooks/useBreakpoints';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

type UseConnectWalletModalOptions = {
  onCancel?: () => void;
  onConnect?: () => void;
  promptOnMobileConnect?: boolean;
};

export const useConnectWalletModal = ({
  onCancel,
  onConnect,
  promptOnMobileConnect = true,
}: UseConnectWalletModalOptions = {}) => {
  const [isConnectWalletOpen, setIsConnectWalletOpen] = useState(false);
  const { isConnecting } = useActiveAccount();
  const { setShowSignInPrompt } = useWeb3Auth();
  const { isConnected } = useConnection();
  const { mutate: disconnect } = useDisconnect();
  const isMobile = useIsMobile();
  const wasConnectedRef = useRef(isConnected);
  const appKitSessionStartedRef = useRef(false);
  const promptOnNextConnectRef = useRef(false);

  useEffect(() => {
    if (!wasConnectedRef.current && isConnected) {
      if (isMobile && promptOnNextConnectRef.current) {
        promptOnNextConnectRef.current = false;
        setShowSignInPrompt(true);
      }

      setIsConnectWalletOpen(false);
      appKitSessionStartedRef.current = false;
      onConnect?.();
    }

    wasConnectedRef.current = isConnected;
  }, [isConnected, isMobile, onConnect, setShowSignInPrompt]);

  useEffect(() => {
    return () => {
      promptOnNextConnectRef.current = false;
    };
  }, []);

  const openConnectWallet = useCallback(() => {
    appKitSessionStartedRef.current = true;
    promptOnNextConnectRef.current = promptOnMobileConnect;
    setIsConnectWalletOpen(true);
  }, [promptOnMobileConnect]);

  const closeConnectWallet = useCallback(() => {
    setIsConnectWalletOpen(false);

    if (!appKitSessionStartedRef.current || isConnected) {
      return;
    }

    appKitSessionStartedRef.current = false;
    promptOnNextConnectRef.current = false;
    onCancel?.();

    if (isConnecting) {
      disconnect();
    }
  }, [disconnect, isConnected, isConnecting, onCancel]);

  return {
    closeConnectWallet,
    isConnectWalletOpen,
    isConnecting,
    openConnectWallet,
  };
};
