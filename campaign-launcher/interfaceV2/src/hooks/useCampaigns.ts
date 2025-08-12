import { useQuery } from '@tanstack/react-query';
import { useChainId } from 'wagmi';

import { launcherApi } from '../api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { CampaignsQueryParams } from '../types';
import { filterFalsyQueryParams } from '../utils';

export const useCampaigns = (params: CampaignsQueryParams) => {
  const { chain_id, exchange_name, status, launcher, limit = 10, skip } = params;
  return useQuery({
    queryKey: [QUERY_KEYS.ALL_CAMPAIGNS, chain_id, exchange_name, status, launcher, limit, skip],
    queryFn: () => {
      const filteredParams = filterFalsyQueryParams(params);
      return launcherApi.getCampaigns(filteredParams)
    },
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
  const { chain_id, exchange_name, status, launcher, limit = 10, skip } = params;
  return useQuery({
    queryKey: [QUERY_KEYS.MY_CAMPAIGNS, chain_id, exchange_name, status, launcher, limit, skip],
    queryFn: () => {
      const filteredParams = filterFalsyQueryParams(params);
      return launcherApi.getCampaigns(filteredParams)
    },
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
  const chainId = useChainId();
  return useQuery({
    queryKey: [QUERY_KEYS.CAMPAIGN_DETAILS, chainId, address],
    queryFn: () => launcherApi.getCampaignDetails(chainId, address),
    enabled: !!chainId && !!address,
    retry: false,
  });
};
