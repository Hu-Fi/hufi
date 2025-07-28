import { useQuery } from '@tanstack/react-query';

import { launcherApi } from '../api';

type Exchange = {
  display_name: string;
  logo: string;
  name: string;
  type: string;
  url: string;
};

export const useExchanges = () => {
  return useQuery({
    queryKey: ['exchanges'],
    queryFn: () => launcherApi.get<Exchange[]>('/exchanges'),
    select: (data) => data.map(({ display_name, ...exchange }) => ({
      ...exchange,
      displayName: display_name,
    })),
  });
};
