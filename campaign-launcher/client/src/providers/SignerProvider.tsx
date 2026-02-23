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

type SignerContextType = {
  signer: JsonRpcSigner | undefined;
  status: SignerStatus;
  isSignerPending: boolean;
  isSignerReady: boolean;
  isSignerMissing: boolean;
};

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

  const isTransportReady = !!client && 'request' in client.transport;

  useEffect(() => {
    const getSigner = async () => {
      if (!isConnected && !isConnecting) {
        setStatus(SignerStatus.DISCONNECTED);
        setSigner(undefined);
        return;
      }

      if (client && isTransportReady && !isSwitching) {
        try {
          setStatus(SignerStatus.CREATING);
          setSigner(undefined);
          let provider = new BrowserProvider(client.transport);
          const network = await provider.getNetwork();

          if (Number(network.chainId) !== appChainId) {
            await client.switchChain({ id: appChainId });
            /* 
              Need to re-create provider after switching chain, 
              because it uses previous chain and can't create signer
            */
            provider = new BrowserProvider(client.transport);
          }

          const _signer = await provider.getSigner(activeAddress);
          setSigner(_signer);
          setStatus(SignerStatus.READY);
        } catch (error) {
          console.error('Error creating signer:', error);
          setSigner(undefined);
          setStatus(SignerStatus.ERROR);
        }
      } else {
        setStatus(SignerStatus.UNAVAILABLE);
        setSigner(undefined);
      }
    };

    getSigner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    client,
    isConnected,
    isConnecting,
    activeAddress,
    isSwitching,
    isTransportReady,
  ]);

  const value = useMemo(
    () => ({
      signer,
      status,
      isSignerPending:
        status === SignerStatus.CREATING ||
        status === SignerStatus.IDLE ||
        status === SignerStatus.UNAVAILABLE,
      isSignerReady: status === SignerStatus.READY,
      isSignerMissing:
        status === SignerStatus.DISCONNECTED || status === SignerStatus.ERROR,
    }),
    [signer, status]
  );

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
