import { useQuery } from '@tanstack/react-query';

import { request } from '../api/recordingApi';

const useGetLiquidityScore = () => {
  return useQuery({
    queryKey: ['liquidityScore'],
    queryFn: () => request('/liquidity-score/total'),
    enabled: false, // TODO: remove this
  });
};

export default useGetLiquidityScore;
