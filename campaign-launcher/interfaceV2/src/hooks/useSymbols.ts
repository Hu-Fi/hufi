import { useQuery } from '@tanstack/react-query';

import { api } from '../api';

export const useSymbols = (exchangeName: string) => {
  return useQuery({
    queryKey: ['symbols', exchangeName],
    queryFn: () =>
      api.exchange
        .exchangeControllerGetSymbols(exchangeName)
        .then((res) => res.data),
    enabled: !!exchangeName,
  });
};
