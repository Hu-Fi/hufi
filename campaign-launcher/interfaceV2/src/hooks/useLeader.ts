import { ChainId } from '@human-protocol/sdk';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { api } from '../api';
import useClientToSigner from './useClientToSigner';

type UseLeaderProps = {
  enabled?: boolean;
};

const useLeader = (options: UseLeaderProps = {}) => {
  const { chainId } = useAccount();
  const { signer } = useClientToSigner();

  const address = signer?.address;

  return useQuery({
    queryKey: ['leader', chainId, address],
    queryFn: () =>
      api.leader
        .leaderControllerGetLeader(chainId as ChainId, address || '')
        .then((res) => res.data),
    enabled: options.enabled ?? (!!chainId && !!address?.length),
  });
};

export default useLeader;
