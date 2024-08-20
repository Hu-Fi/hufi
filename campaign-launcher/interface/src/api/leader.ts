import { ChainId } from '@human-protocol/sdk';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { useApi } from './use-api';
import { useClientToSigner } from '../hooks/human-protocol-sdk/common';

export const useLeader = () => {
  const { chainId } = useAccount();
  const { signer } = useClientToSigner();
  const api = useApi();

  const address = signer?.address;

  return useQuery({
    queryKey: ['leader', chainId, address],
    queryFn: () =>
      api.leader
        .leaderControllerGetLeader(chainId as ChainId, address || '')
        .then((res) => res.data),
    enabled: !!chainId && !!address?.length,
  });
};
