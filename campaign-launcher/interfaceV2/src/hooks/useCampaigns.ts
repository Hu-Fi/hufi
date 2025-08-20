import { useQuery } from '@tanstack/react-query';

import { launcherApi } from '../api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useNetwork } from '../providers/NetworkProvider';
import { CampaignsQueryParams } from '../types';

export const useCampaigns = (params: CampaignsQueryParams) => {
  const { chain_id, status, launcher, limit = 10, skip } = params;
  return useQuery({
    queryKey: [QUERY_KEYS.ALL_CAMPAIGNS, chain_id, status, launcher, limit, skip],
    queryFn: () => launcherApi.getCampaigns(params),
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
    queryKey: [QUERY_KEYS.MY_CAMPAIGNS, chain_id, status, launcher, limit, skip],
    queryFn: () => launcherApi.getCampaigns(params),
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
}
