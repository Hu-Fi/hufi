import { useQuery } from '@tanstack/react-query';

import { launcherApi } from '../api';
import { QUERY_KEYS } from '../constants/queryKeys';

export const useTradingPairs = (exchangeName: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.TRADING_PAIRS, exchangeName],
    queryFn: () => launcherApi.getTradingPairs(exchangeName),
    enabled: !!exchangeName,
  });
};
