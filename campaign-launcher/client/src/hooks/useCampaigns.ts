import { useQuery, useQueryClient } from '@tanstack/react-query';

import { launcherApi } from '@/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useNetwork } from '@/providers/NetworkProvider';
import type { CampaignsQueryParams } from '@/types';

import { useIsMobile } from './useBreakpoints';

export const useCampaigns = (
  params: CampaignsQueryParams,
  options?: { enabled?: boolean }
) => {
  const isMobile = useIsMobile();
  const { chain_id, status, launcher, limit = 10, skip } = params;
  const { enabled = true } = options ?? {};

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
    enabled: enabled && !!chain_id,
    placeholderData: (prev) =>
      prev?.results?.length && isMobile ? prev : undefined,
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
