import { useQuery } from '@tanstack/react-query';

import { launcherApi } from '../api';

export const useExchanges = () => {
  return useQuery({
    queryKey: ['exchanges'],
    queryFn: () => launcherApi.getExchanges(),
  });
};
