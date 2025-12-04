import type { ChainId } from '@human-protocol/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { recordingApi } from '@/api';
import { AUTHED_QUERY_TAG, QUERY_KEYS } from '@/constants/queryKeys';
import useRetrieveSigner from '@/hooks/useRetrieveSigner';
import { useNetwork } from '@/providers/NetworkProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import type { EvmAddress, CampaignsQueryParams } from '@/types';

type JoinedCampaignsParams = Pick<
  CampaignsQueryParams,
  'status' | 'limit' | 'skip'
>;

export const useGetJoinedCampaigns = (params: JoinedCampaignsParams = {}) => {
  const { signer } = useRetrieveSigner();
  const { isAuthenticated } = useWeb3Auth();
  const { status, limit, skip } = params;

  return useQuery({
    queryKey: [
      QUERY_KEYS.JOINED_CAMPAIGNS,
      isAuthenticated,
      !!signer,
      status,
      limit,
      skip,
      AUTHED_QUERY_TAG,
    ],
    queryFn: () => recordingApi.getJoinedCampaigns(params),
    select: (data) => ({
      ...data,
      results: data.results.map((campaign) => ({
        ...campaign,
        id: campaign.address,
      })),
    }),
    enabled: isAuthenticated && !!signer,
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
