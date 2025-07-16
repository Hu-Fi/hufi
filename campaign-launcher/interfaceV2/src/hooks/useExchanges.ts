import { useQuery } from '@tanstack/react-query';

import { api } from '../api';

type Exchange = {
  displayName: string;
  logo: string;
  name: string;
  type: string;
  url: string;
};

export const useExchanges = () => {
  return useQuery({
    queryKey: ['exchanges'],
    queryFn: () =>
      api.exchange
        .exchangeControllerGetExchangeList()
        .then((res) => res.data as Exchange[]),
    enabled: false, // TODO: remove this
  });
};
