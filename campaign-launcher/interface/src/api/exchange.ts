import { useQuery } from '@tanstack/react-query';

import { useApi } from './use-api';

export const useExchanges = () => {
  const api = useApi();

  return useQuery({
    queryKey: ['exchanges'],
    queryFn: () =>
      api.exchange.exchangeControllerGetExchangeList().then((res) => res.data),
  });
};

export const useSymbols = (exchangeName: string) => {
  const api = useApi();

  return useQuery({
    queryKey: ['symbols', exchangeName],
    queryFn: () =>
      api.exchange
        .exchangeControllerGetSymbols(exchangeName)
        .then((res) => res.data),
    enabled: !!exchangeName,
  });
};
