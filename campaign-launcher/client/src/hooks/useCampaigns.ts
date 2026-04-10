import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { launcherApi } from '@/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useNetwork } from '@/providers/NetworkProvider';
import type { CampaignsQueryParams } from '@/types';

export const useCampaigns = (params: CampaignsQueryParams) => {
  const { chain_id, status, type, exchange, limit, skip } = params;

  return useQuery({
    queryKey: [
      QUERY_KEYS.ALL_CAMPAIGNS,
      chain_id,
      status,
      type,
      exchange,
      limit,
      skip,
    ],
    queryFn: ({ signal }) => launcherApi.getCampaigns(params, signal),
    enabled: !!chain_id,
    placeholderData: keepPreviousData,
  });
};

export const useHostedCampaigns = (params: CampaignsQueryParams) => {
  const { chain_id, status, launcher, type, exchange, limit, skip } = params;

  return useQuery({
    queryKey: [
      QUERY_KEYS.HOSTED_CAMPAIGNS,
      launcher,
      chain_id,
      status,
      type,
      exchange,
      limit,
      skip,
    ],
    queryFn: ({ signal }) => launcherApi.getCampaigns(params, signal),
    enabled: !!chain_id && !!launcher,
    placeholderData: keepPreviousData,
  });
};

export const useCampaignDetails = (address: string) => {
  const { appChainId } = useNetwork();

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
