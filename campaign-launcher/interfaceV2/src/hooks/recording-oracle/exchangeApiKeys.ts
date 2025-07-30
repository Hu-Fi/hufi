import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import { recordingApi } from "../../api";
import { useWeb3Auth } from "../../providers/Web3AuthProvider";

export const useGetExchangeApiKeys = () => {
  const { isAuthenticated } = useWeb3Auth();
  const { isConnected } = useAccount();

  return useQuery({
    queryKey: ['exchange-api-keys'],
    queryFn: () => recordingApi.get<string[]>('/exchange-api-keys'),
    enabled: isAuthenticated && isConnected,
  });
};

type MutationPayload = {
  exchangeName: string;
  apiKey: string;
  secret: string;
}

export const usePostExchangeApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['post-exchange-api-keys'],
    mutationFn: (data: MutationPayload) => 
      recordingApi.post(`/exchange-api-keys/${data.exchangeName}`, {
        api_key: data.apiKey,
        secret_key: data.secret,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-api-keys'] });
    },
  });
};

export const useDeleteApiKeyByExchange = (exchangeName: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recordingApi.delete(`/exchange-api-keys/${exchangeName}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-api-keys'] });
    },
  });
};