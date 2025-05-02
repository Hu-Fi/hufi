import { useMemo } from 'react';

import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { Config, useAccount, useConnectorClient } from 'wagmi';

import { clientToSigner } from '../utils/wagmiEthers';

const useClientToSigner = () => {
  const { chainId } = useAccount();
  const { data: client } = useConnectorClient<Config>();

  return useMemo(() => {
    let network = undefined;
    let signer = undefined;

    if (!client) {
      return {
        network,
        signer,
      };
    }

    network = NETWORKS[chainId as ChainId];
    signer = clientToSigner(client);

    return {
      network,
      signer,
    };
  }, [client]);
};

export default useClientToSigner;
