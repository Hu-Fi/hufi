import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { recordingApi } from '../../api';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';

export const useGetEnrolledExchanges = () => {
  const { isAuthenticated } = useWeb3Auth();
  const { isConnected } = useAccount();

  return useQuery({
    queryKey: [QUERY_KEYS.ENROLLED_EXCHANGES],
    queryFn: () => recordingApi.getEnrolledExchanges(),
    enabled: isAuthenticated && isConnected,
  });
};

export const useGetExchangesWithApiKeys = () => {
  const { isAuthenticated } = useWeb3Auth();
  const { isConnected } = useAccount();

  return useQuery({
    queryKey: [QUERY_KEYS.EXCHANGES_WITH_API_KEYS],
    queryFn: () => recordingApi.getExchangesWithApiKeys(),
    enabled: isAuthenticated && isConnected,
  });
};

type MutationPayload = {
  exchangeName: string;
  apiKey: string;
  secret: string;
};

export const usePostExchangeApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['post-exchange-api-keys'],
    mutationFn: (data: MutationPayload) =>
      recordingApi.upsertExchangeApiKey(
        data.exchangeName,
        data.apiKey,
        data.secret
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EXCHANGES_WITH_API_KEYS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ENROLLED_EXCHANGES],
      });
    },
  });
};

export const useDeleteApiKeyByExchange = (exchangeName: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recordingApi.deleteApiKeysForExchange(exchangeName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EXCHANGES_WITH_API_KEYS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ENROLLED_EXCHANGES],
      });
    },
  });
};
