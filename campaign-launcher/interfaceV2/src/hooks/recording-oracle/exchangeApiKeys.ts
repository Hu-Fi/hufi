import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import axiosInstance from "../../api/recordingApi";
import { useWeb3Auth } from "../../providers/Web3AuthProvider";

export const useGetExchangeApiKeys = () => {
  const { isAuthenticated } = useWeb3Auth();
  const { isConnected } = useAccount();

  return useQuery({
    queryKey: ['exchange-api-keys'],
    queryFn: () => axiosInstance.get('/exchange-api-keys'),
    enabled: isAuthenticated && isConnected,
  });
};