import { ChainId } from '@human-protocol/sdk';
import { useQuery } from '@tanstack/react-query';

import { api, launcherApi } from '../api';
import { CampaignDataDto } from '../api/client';
import { CampaignsStats } from '../types';

export type Campaign = CampaignDataDto;

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
    queryKey: ['all-campaigns', chain_id, exchange_name, status, launcher, limit, skip],
    queryFn: () => {
      const filteredParams = filterParams(params);
      return launcherApi.getCampaigns(filteredParams)
    },
    enabled: !!chain_id,
  });
};

export const useMyCampaigns = (params: CampaignsParams) => {
  const { chain_id, exchange_name, status, launcher, limit = 10, skip } = params;
  return useQuery({
    queryKey: ['my-campaigns', chain_id, exchange_name, status, launcher, limit, skip],
    queryFn: () => {
      const filteredParams = filterParams(params);
      return launcherApi.getCampaigns(filteredParams)
    },
    enabled: !!chain_id && !!launcher,
  });
};

export const useCampaign = (chainId: ChainId, address: string) => {
  return useQuery({
    queryKey: ['campaign', chainId, address],
    queryFn: () =>
      api.campaign
        .campaignControllerGetCampaign(chainId, address)
        .then((res) => res.data),
  });
};

export const useCampaignsStats = (chainId: ChainId) => {
  return useQuery({
    queryKey: ['campaignsStats', chainId],
    queryFn: () =>
      api.campaign
        .campaignControllerGetCampaignsStats({ chainId })
        .then((res) => (res.data as unknown) as CampaignsStats),
    enabled: false, // TODO: remove this
  });
};
