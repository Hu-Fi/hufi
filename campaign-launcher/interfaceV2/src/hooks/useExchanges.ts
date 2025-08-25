import { useQuery } from '@tanstack/react-query';

import { launcherApi } from '../api';
import { QUERY_KEYS } from '../constants/queryKeys';

export const useExchanges = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.EXCHANGES],
    queryFn: () => launcherApi.getExchanges(),
  });
};
