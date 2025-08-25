import { ChainId } from '@human-protocol/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { recordingApi } from '../../api';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useNetwork } from '../../providers/NetworkProvider';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';
import { CampaignsQueryParams } from '../../types';
import useRetrieveSigner from '../useRetrieveSigner';

type JoinedCampaignsParams = Pick<CampaignsQueryParams, 'status' | 'limit' | 'skip'>;

export const useGetJoinedCampaigns = (params: JoinedCampaignsParams = {}) => {
  const { signer } = useRetrieveSigner();
  const { isAuthenticated } = useWeb3Auth();
  const { status, limit, skip } = params;

  return useQuery({
    queryKey: [QUERY_KEYS.JOINED_CAMPAIGNS, isAuthenticated, !!signer, status, limit, skip],
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
    mutationFn: ({ chainId, address }: { chainId: ChainId; address: `0x${string}` }) => recordingApi.joinCampaign(chainId, address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOINED_CAMPAIGNS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHECK_IS_JOINED_CAMPAIGN] });
    },
  });
};

export const useCheckIsJoinedCampaign = (address: `0x${string}`) => {
  const { appChainId } = useNetwork();
  const { isAuthenticated } = useWeb3Auth();

  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_IS_JOINED_CAMPAIGN, appChainId, address],
    queryFn: () => recordingApi.checkIsJoinedCampaign(appChainId, address),
    select: (data) => data.is_joined,
    enabled: isAuthenticated && !!appChainId && !!address,
  });
};
