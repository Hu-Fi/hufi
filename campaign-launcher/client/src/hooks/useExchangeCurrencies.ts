import { useQuery } from '@tanstack/react-query';

import { launcherApi } from '../api';
import { QUERY_KEYS } from '../constants/queryKeys';

export const useExchangeCurrencies = (exchangeName: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.EXCHANGE_CURRENCIES, exchangeName],
    queryFn: () => launcherApi.getExchangeCurrencies(exchangeName),
    enabled: !!exchangeName,
  });
};
