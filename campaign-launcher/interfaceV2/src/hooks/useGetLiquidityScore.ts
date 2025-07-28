import { useQuery } from '@tanstack/react-query';

import { recordingApi } from '../api';

const useGetLiquidityScore = () => {
  return useQuery({
    queryKey: ['liquidityScore'],
    queryFn: () => recordingApi.get('/liquidity-score/total'),
    enabled: false, // TODO: remove this
  });
};

export default useGetLiquidityScore;
