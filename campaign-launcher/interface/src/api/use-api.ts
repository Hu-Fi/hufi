import { useContext } from 'react';

import { ApiContext } from '@/providers';

export const useApi = () => {
  const api = useContext(ApiContext);

  if (!api) {
    throw new Error('useApi requires ApiContext');
  }

  return api;
};
