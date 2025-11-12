import { useQuery } from '@tanstack/react-query';

import { recordingApi } from '@/api';
import { AUTHED_QUERY_TAG, QUERY_KEYS } from '@/constants/queryKeys';
import { useNetwork } from '@/providers/NetworkProvider';
import type { EvmAddress } from '@/types';

export const useGetUserProgress = (address: EvmAddress) => {
  const { appChainId } = useNetwork();

  return useQuery({
    queryKey: [QUERY_KEYS.USER_PROGRESS, appChainId, address, AUTHED_QUERY_TAG],
    queryFn: () => recordingApi.getUserProgress(appChainId, address),
    enabled: !!appChainId && !!address,
  });
};
