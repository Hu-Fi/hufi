import { useQuery } from "@tanstack/react-query";

import { recordingApi } from "../../api";
import { QUERY_KEYS } from "../../constants/queryKeys";
import { useNetwork } from "../../providers/NetworkProvider";
import { Address } from "../../types";

export const useGetUserProgress = (address: Address) => {
  const { appChainId } = useNetwork();

  return useQuery({
    queryKey: [QUERY_KEYS.USER_PROGRESS, appChainId, address],
    queryFn: () => recordingApi.getUserProgress(appChainId, address),
    enabled: !!appChainId && !!address,
  });
};
