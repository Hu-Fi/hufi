import type { ChainId } from '@human-protocol/sdk';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { recordingApi } from '@/api';
import { AUTHED_QUERY_TAG, QUERY_KEYS } from '@/constants/queryKeys';
import { useNetwork } from '@/providers/NetworkProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import type { EvmAddress, CampaignsQueryParams } from '@/types';

type JoinedCampaignsParams = Partial<Omit<CampaignsQueryParams, 'launcher'>>;

export const useJoinedCampaigns = (params: JoinedCampaignsParams = {}) => {
  const { isAuthenticated } = useWeb3Auth();
  const { chain_id, status, type, exchange, limit, skip } = params;

  return useQuery({
    queryKey: [
      QUERY_KEYS.JOINED_CAMPAIGNS,
      isAuthenticated,
      chain_id,
      status,
      type,
      exchange,
      limit,
      skip,
      AUTHED_QUERY_TAG,
    ],
    queryFn: ({ signal }) => recordingApi.getJoinedCampaigns(params, signal),
    staleTime: Infinity,
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
  });
};

export const useJoinCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chainId,
      address,
    }: {
      chainId: ChainId;
      address: EvmAddress;
    }) => recordingApi.joinCampaign(chainId, address),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.JOINED_CAMPAIGNS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_CAMPAIGN_JOIN_STATUS],
      });
    },
  });
};

export const useCheckCampaignJoinStatus = (address: EvmAddress) => {
  const { appChainId } = useNetwork();
  const { isAuthenticated } = useWeb3Auth();

  return useQuery({
    queryKey: [
      QUERY_KEYS.CHECK_CAMPAIGN_JOIN_STATUS,
      appChainId,
      address,
      isAuthenticated,
      AUTHED_QUERY_TAG,
    ],
    queryFn: () => recordingApi.checkCampaignJoinStatus(appChainId, address),
    enabled: isAuthenticated && !!appChainId && !!address,
  });
};

export const useGetLeaderboard = ({
  address,
  enabled = true,
}: {
  address: string;
  enabled?: boolean;
}) => {
  const { appChainId } = useNetwork();

  return useQuery({
    queryKey: [QUERY_KEYS.LEADERBOARD, appChainId, address],
    queryFn: () => recordingApi.getLeaderboard(appChainId, address),
    enabled: enabled && !!appChainId && !!address,
    select: (data) => ({
      ...data,
      data: data.data.map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      })),
    }),
  });
};
