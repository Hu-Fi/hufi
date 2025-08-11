import { ChainId } from '@human-protocol/sdk';
import { useQuery } from '@tanstack/react-query';
import { useChainId } from 'wagmi';

import { launcherApi } from '../api';
import { QUERY_KEYS } from '../constants/queryKeys';

type CampaignsParams = {
  chain_id: ChainId;
  exchange_name?: string;
  status?: string;
  launcher?: string;
  limit?: number;
  skip?: number;
}

const filterParams = (params: CampaignsParams) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => Boolean(value))
  );
};

export const useCampaigns = (params: CampaignsParams) => {
  const { chain_id, exchange_name, status, launcher, limit = 10, skip } = params;
  return useQuery({
    queryKey: [QUERY_KEYS.ALL_CAMPAIGNS, chain_id, exchange_name, status, launcher, limit, skip],
    queryFn: () => {
      const filteredParams = filterParams(params);
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

export const useMyCampaigns = (params: CampaignsParams) => {
  const { chain_id, exchange_name, status, launcher, limit = 10, skip } = params;
  return useQuery({
    queryKey: [QUERY_KEYS.MY_CAMPAIGNS, chain_id, exchange_name, status, launcher, limit, skip],
    queryFn: () => {
      const filteredParams = filterParams(params);
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
