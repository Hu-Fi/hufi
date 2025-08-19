import { useEffect, useState } from 'react';

import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { Config, useWalletClient } from 'wagmi';

import { useActiveAccount } from '../providers/ActiveAccountProvider';
import { useNetwork } from '../providers/NetworkProvider';

const useClientToSigner = () => {
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);
  const [isCreatingSigner, setIsCreatingSigner] = useState(false);

  const { appChainId, isSwitching } = useNetwork();
  const { activeAddress } = useActiveAccount();
  const { data: client } = useWalletClient<Config>({
    account: activeAddress,
    chainId: appChainId,
  });

  const isTransportReady = client && 'request' in client.transport;

  useEffect(() => {
    const getSigner = async () => {
      setIsCreatingSigner(true);
      try {
        setSigner(undefined);
        if (client && isTransportReady && !isSwitching) {
          const provider = new BrowserProvider(client.transport);
          const network = await provider.getNetwork();
          
          if (Number(network.chainId) !== appChainId) {
            await client.switchChain({ id: appChainId });
          }
          
          const _signer = await provider.getSigner(activeAddress);
          setSigner(_signer);
        }
      } catch (error) {
        console.error('Error creating signer:', error);
        setSigner(undefined);
      } finally {
        setIsCreatingSigner(false);
      }
    }

    getSigner();
  }, [client, activeAddress, isSwitching, isTransportReady]);

  return { signer, isCreatingSigner };
};

export default useClientToSigner;
