import { useQuery } from "@tanstack/react-query";

import { launcherApi } from "../api";

export const useTradingPairs = (exchangeName: string) => {
  return useQuery({
    queryKey: ['trading-pairs', exchangeName],
    queryFn: () => launcherApi.get(`/exchanges/${exchangeName}/trading-pairs`),
    enabled: !!exchangeName,
  });
};