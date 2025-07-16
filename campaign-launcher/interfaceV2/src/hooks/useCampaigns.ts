import { ChainId } from '@human-protocol/sdk';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { api } from '../api';
import { CampaignDataDto } from '../api/client';
import { CampaignsStats } from '../types';

export type Campaign = CampaignDataDto;

export const useCampaigns = (
  chainId: ChainId,
  status?: string,
  exchangeName?: string
) => {
  return useQuery({
    queryKey: ['campaigns', chainId, status, exchangeName],
    queryFn: () =>
      api.campaign
        .campaignControllerGetCampaigns({ chainId, status, exchangeName })
        .then((res) => res.data),
  });
};

export const useMyCampaigns = (chainId: ChainId, launcher?: string) => {
  const { isConnected } = useAccount();

  return useQuery({
    queryKey: ['myCampaigns', chainId, launcher],
    queryFn: () =>
      api.campaign
        .campaignControllerGetCampaigns({ chainId, launcher })
        .then((res) => res.data),
    enabled: !!chainId && !!launcher && !!isConnected,
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
  });
};
