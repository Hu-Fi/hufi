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

  useEffect(() => {
    const getSigner = async () => {
      setIsCreatingSigner(true);
      if (client) {
        const provider = new BrowserProvider(client.transport);
        const _signer = await provider.getSigner(activeAddress);
        const signerChainId = await _signer.provider.getNetwork();
        if (Number(signerChainId.chainId) !== appChainId && !isSwitching) {
          await client.switchChain({ id: appChainId });
        }
        setSigner(_signer);
        setIsCreatingSigner(false);
      }
    }

    getSigner();
  }, [client, activeAddress, isSwitching]);

  return { signer, isCreatingSigner };
};

export default useClientToSigner;
