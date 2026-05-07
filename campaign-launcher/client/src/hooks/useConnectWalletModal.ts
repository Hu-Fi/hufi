import { useCallback, useEffect, useRef } from 'react';

import { useAppKit, useAppKitState } from '@reown/appkit/react';
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
    if (!wasConnectedRef.current && isConnected) {
      if (isMobile && promptOnNextConnectRef.current) {
        promptOnNextConnectRef.current = false;
        setShowSignInPrompt(true);
      }

      appKitSessionStartedRef.current = false;
      appKitModalWasOpenRef.current = false;
      onConnect?.();
    }

    wasConnectedRef.current = isConnected;
  }, [isConnected, isMobile, onConnect, setShowSignInPrompt]);

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
    onCancel?.();

    if (isConnecting) {
      disconnect();
    }
  }, [disconnect, isAppKitOpen, isConnected, isConnecting, onCancel]);

  const openConnectWallet = useCallback(() => {
    appKitSessionStartedRef.current = true;
    promptOnNextConnectRef.current = promptOnMobileConnect;

    void open({ view: 'Connect' }).catch(() => {
      appKitSessionStartedRef.current = false;
      appKitModalWasOpenRef.current = false;
      promptOnNextConnectRef.current = false;
      onCancel?.();
    });
  }, [onCancel, open, promptOnMobileConnect]);

  return {
    isConnecting,
    openConnectWallet,
  };
};
