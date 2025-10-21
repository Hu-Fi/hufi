import { useQuery } from '@tanstack/react-query';

import { recordingApi } from '@/api';
import { QUERY_KEYS } from '@/constants/queryKeys';

export const useGetTotalVolume = (exchange_name: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.TOTAL_VOLUME, exchange_name],
    queryFn: () => recordingApi.getTotalVolume(exchange_name),
    select: (data) => data.total_volume,
  });
};
