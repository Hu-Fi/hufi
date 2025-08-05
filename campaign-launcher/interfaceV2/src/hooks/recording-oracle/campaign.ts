import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { recordingApi } from '../../api';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';

export const useGetJoinedCampaigns = () => {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useWeb3Auth();

  return useQuery({
    queryKey: ['user-joined-campaigns'],
    queryFn: () => recordingApi.getJoinedCampaigns(),
    enabled: isAuthenticated && isConnected,
  });
};
