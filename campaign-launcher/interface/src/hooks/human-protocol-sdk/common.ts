import { useMemo } from 'react';

import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { Config, useChainId, useConnectorClient } from 'wagmi';

import { clientToSigner } from '../../utils/wagmi-ethers';

export const useClientToSigner = () => {
  const chainId = useChainId();
  const { data: client } = useConnectorClient<Config>({ chainId });

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
