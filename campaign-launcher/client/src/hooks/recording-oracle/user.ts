import { useQuery } from "@tanstack/react-query";

import { recordingApi } from "../../api";
import { QUERY_KEYS } from "../../constants/queryKeys";
import { useNetwork } from "../../providers/NetworkProvider";

export const useGetUserProgress = (address: `0x${string}`) => {
  const { appChainId } = useNetwork();

  return useQuery({
    queryKey: [QUERY_KEYS.USER_PROGRESS, appChainId, address],
    queryFn: () => recordingApi.getUserProgress(appChainId, address as `0x${string}`),
    enabled: !!appChainId && !!address,
  });
};
