import { ChainId } from '@human-protocol/sdk';
import { useQuery } from '@tanstack/react-query';

import { useApi } from './use-api';

export const useCampaigns = (chainId: ChainId) => {
  const api = useApi();

  return useQuery({
    queryKey: ['campaigns', chainId],
    queryFn: () =>
      api.campaign
        .campaignControllerGetCampaigns({
          chainId,
        })
        .then((res) => res.data),
  });
};

export const useCampaign = (chainId: ChainId, address: string) => {
  const api = useApi();

  return useQuery({
    queryKey: ['campaign', chainId, address],
    queryFn: () =>
      api.campaign
        .campaignControllerGetCampaign(chainId, address)
        .then((res) => res.data),
  });
};
