import {
  type FC,
  type PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { BrowserProvider, type JsonRpcSigner } from 'ethers';
import { type Config, useConnection, useWalletClient } from 'wagmi';

import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { useNetwork } from '@/providers/NetworkProvider';

type SignerReadyContextType = {
  signer: JsonRpcSigner;
  isSignerReady: true;
  status: SignerStatus;
  isSignerPending: boolean;
  isSignerMissing: boolean;
};

type SignerNotReadyContextType = {
  signer: undefined;
  isSignerReady: false;
  status: SignerStatus;
  isSignerPending: boolean;
  isSignerMissing: boolean;
};

type SignerContextType = SignerReadyContextType | SignerNotReadyContextType;

const SignerContext = createContext<SignerContextType | undefined>(undefined);

enum SignerStatus {
  IDLE = 'idle',
  CREATING = 'creating',
  READY = 'ready',
  ERROR = 'error',
  DISCONNECTED = 'disconnected',
  UNAVAILABLE = 'unavailable',
}

const SignerProvider: FC<PropsWithChildren> = ({ children }) => {
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);
  const [status, setStatus] = useState<SignerStatus>(SignerStatus.IDLE);

  const { appChainId, isSwitching } = useNetwork();
  const { activeAddress } = useActiveAccount();
  const { isConnected, isConnecting, chainId: walletChainId } = useConnection();
  const { data: client } = useWalletClient<Config>({
    account: activeAddress,
    chainId: walletChainId, // this is crucial to avoid the mismatch error
    query: { enabled: !!activeAddress && isConnected && !isSwitching },
  });

  useEffect(() => {
    let cancelled = false;

    const getSigner = async () => {
      if (!isConnected && !isConnecting) {
        setStatus(SignerStatus.DISCONNECTED);
        setSigner(undefined);
        return;
      }

      if (!!client && !isSwitching) {
        try {
          setStatus(SignerStatus.CREATING);
          setSigner(undefined);
          let provider = new BrowserProvider(client.transport);
          const network = await provider.getNetwork();

          if (cancelled) return;

          if (Number(network.chainId) !== appChainId) {
            await client.switchChain({ id: appChainId });
            /* 
              Need to re-create provider after switching chain, 
              because it uses previous chain and can't create signer
            */

            if (cancelled) return;
            provider = new BrowserProvider(client.transport);
          }

          const _signer = await provider.getSigner(activeAddress);
          if (cancelled) return;
          setSigner(_signer);
          setStatus(SignerStatus.READY);
        } catch (error) {
          if (cancelled) return;
          console.error('Error creating signer:', error);
          setSigner(undefined);
          setStatus(SignerStatus.ERROR);
        }
      } else {
        if (cancelled) return;
        setStatus(SignerStatus.UNAVAILABLE);
        setSigner(undefined);
      }
    };

    getSigner();

    return () => {
      cancelled = true;
    };
  }, [
    client,
    isConnected,
    isConnecting,
    activeAddress,
    isSwitching,
    appChainId,
  ]);

  const value = useMemo<SignerContextType>(() => {
    const isSignerReady =
      !isSwitching && status === SignerStatus.READY && !!signer;
    const isSignerMissing =
      status === SignerStatus.DISCONNECTED || status === SignerStatus.ERROR;
    const isSignerPending = !isSignerReady && !isSignerMissing;

    if (isSignerReady) {
      return {
        signer,
        status,
        isSignerReady: true,
        isSignerMissing,
        isSignerPending,
      };
    }

    return {
      signer: undefined,
      status,
      isSignerReady: false,
      isSignerMissing,
      isSignerPending,
    };
  }, [signer, status, isSwitching]);

  return (
    <SignerContext.Provider value={value}>{children}</SignerContext.Provider>
  );
};

export const useSignerContext = () => {
  const context = useContext(SignerContext);
  if (!context) {
    throw new Error('useSignerContext must be used within a SignerProvider');
  }
  return context;
};

export default SignerProvider;
