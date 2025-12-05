import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useConnection } from 'wagmi';

import { recordingApi } from '@/api';
import { AUTHED_QUERY_TAG, QUERY_KEYS } from '@/constants/queryKeys';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import * as errorUtils from '@/utils/error';

export const useGetEnrolledExchanges = () => {
  const { isAuthenticated } = useWeb3Auth();
  const { isConnected } = useConnection();

  return useQuery({
    queryKey: [QUERY_KEYS.ENROLLED_EXCHANGES, AUTHED_QUERY_TAG],
    queryFn: () => recordingApi.getEnrolledExchanges(),
    enabled: isAuthenticated && isConnected,
  });
};

export const useGetExchangesWithApiKeys = () => {
  const { isAuthenticated } = useWeb3Auth();
  const { isConnected } = useConnection();

  return useQuery({
    queryKey: [QUERY_KEYS.EXCHANGES_WITH_API_KEYS, AUTHED_QUERY_TAG],
    queryFn: () => recordingApi.getExchangesWithApiKeys(),
    enabled: isAuthenticated && isConnected,
  });
};

type MutationPayload = {
  exchangeName: string;
  apiKey: string;
  secret: string;
  extras?: Record<string, string>;
};

export const usePostExchangeApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['post-exchange-api-keys'],
    mutationFn: async (data: MutationPayload) => {
      try {
        await recordingApi.upsertExchangeApiKey(
          data.exchangeName,
          data.apiKey,
          data.secret,
          data.extras
        );
      } catch (error) {
        let message = errorUtils.getMessageFromError(error);
        if (!message) {
          throw error;
        }

        const details = errorUtils.getDetailsFromError(error);
        if (
          Array.isArray(details?.missing_permissions) &&
          details.missing_permissions.length
        ) {
          message += `. Missing permissions: ${details.missing_permissions.join(', ')}.`;
        }

        throw message;
      }
    },
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
