import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { recordingApi } from '@/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import { type PatchPreferencesDto } from '@/types';

export const useGetUserInfo = () => {
  const { isAuthenticated } = useWeb3Auth();

  return useQuery({
    queryKey: [QUERY_KEYS.USER_INFO, isAuthenticated],
    queryFn: () => recordingApi.getUserInfo(),
    enabled: isAuthenticated,
  });
};

export const usePatchUserPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: PatchPreferencesDto) =>
      recordingApi.patchUserPreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.USER_INFO],
      });
    },
  });
};
