import { useQuery, useQueryClient } from '@tanstack/react-query';

import { launcherApi } from '@/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useNetwork } from '@/providers/NetworkProvider';
import type { CampaignsQueryParams } from '@/types';

export const useCampaigns = (params: CampaignsQueryParams) => {
  const { chain_id, status, launcher, limit = 10, skip } = params;

  return useQuery({
    queryKey: [
      QUERY_KEYS.ALL_CAMPAIGNS,
      chain_id,
      launcher,
      status,
      limit,
      skip,
    ],
    queryFn: ({ signal }) => launcherApi.getCampaigns(params, signal),
    select: (data) => ({
      ...data,
      results: data.results.map((campaign) => ({
        ...campaign,
        id: campaign.address,
      })),
    }),
    enabled: !!chain_id,
  });
};

export const useMyCampaigns = (params: CampaignsQueryParams) => {
  const { chain_id, status, launcher, limit = 10, skip } = params;

  return useQuery({
    queryKey: [
      QUERY_KEYS.MY_CAMPAIGNS,
      chain_id,
      launcher,
      status,
      limit,
      skip,
    ],
    queryFn: ({ signal }) => launcherApi.getCampaigns(params, signal),
    select: (data) => ({
      ...data,
      results: data.results.map((campaign) => ({
        ...campaign,
        id: campaign.address,
      })),
    }),
    enabled: !!chain_id && !!launcher,
  });
};

export const useCampaignDetails = (address: string) => {
  const { appChainId } = useNetwork();
  const queryClient = useQueryClient();

  queryClient.removeQueries({
    queryKey: [QUERY_KEYS.CAMPAIGN_DAILY_PAID_AMOUNTS, appChainId, address],
  });

  return useQuery({
    queryKey: [QUERY_KEYS.CAMPAIGN_DETAILS, appChainId, address],
    queryFn: () => launcherApi.getCampaignDetails(appChainId, address),
    enabled: !!appChainId && !!address,
    retry: false,
  });
};

export const useGetCampaignsStats = () => {
  const { appChainId } = useNetwork();
  return useQuery({
    queryKey: [QUERY_KEYS.CAMPAIGNS_STATS, appChainId],
    queryFn: () => launcherApi.getCampaignsStats(appChainId),
    enabled: !!appChainId,
  });
};

export const useCampaignDailyPaidAmounts = (
  address: string,
  options?: { enabled?: boolean }
) => {
  const { appChainId } = useNetwork();
  return useQuery({
    queryKey: [QUERY_KEYS.CAMPAIGN_DAILY_PAID_AMOUNTS, appChainId, address],
    queryFn: () => launcherApi.getCampaignDailyPaidAmounts(appChainId, address),
    enabled: (options?.enabled ?? true) && !!appChainId && !!address,
    retry: false,
    staleTime: Infinity,
  });
};
