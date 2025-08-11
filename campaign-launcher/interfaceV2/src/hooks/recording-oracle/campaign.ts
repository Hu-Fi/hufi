import { ChainId } from '@human-protocol/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { recordingApi } from '../../api';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';

export const useGetJoinedCampaigns = (enabled?: boolean) => {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useWeb3Auth();

  return useQuery({
    queryKey: [QUERY_KEYS.JOINED_CAMPAIGNS],
    queryFn: () => recordingApi.getJoinedCampaigns(),
    select: (data) => ({
      ...data,
      results: data.results.map((campaign) => ({
        ...campaign,
        id: campaign.address,
      })),
    }),
    enabled: isAuthenticated && isConnected && (enabled ?? true),
  });
};

export const useJoinCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chainId, address }: { chainId: ChainId; address: `0x${string}` }) => recordingApi.joinCampaign(chainId, address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOINED_CAMPAIGNS] });
    },
  });
};
