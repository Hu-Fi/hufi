import { useEffect, useState } from 'react';

import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { Config, useAccount, useWalletClient } from 'wagmi';

import { useActiveAccount } from '../providers/ActiveAccountProvider';
import { useNetwork } from '../providers/NetworkProvider';

const useRetrieveSigner = () => {
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const { appChainId, isSwitching } = useNetwork();
  const { activeAddress } = useActiveAccount();
  const { isConnected, chainId: walletChainId } = useAccount();
  const { data: client } = useWalletClient<Config>({
    account: activeAddress,
    chainId: walletChainId, // this is crucial to avoid the mismatch error
    query: { enabled: !!activeAddress && isConnected && !isSwitching },
  });

  const isTransportReady = client && 'request' in client.transport;

  useEffect(() => {
    const getSigner = async () => {
      setIsLoading(true);
      try {
        setSigner(undefined);
        if (client && isTransportReady && !isSwitching) {
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
        }
      } catch (error) {
        console.error('Error creating signer:', error);
        setSigner(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    getSigner();
  }, [client, activeAddress, isSwitching, isTransportReady]);

  return { signer, isCreatingSigner: isLoading };
};

export default useRetrieveSigner;
