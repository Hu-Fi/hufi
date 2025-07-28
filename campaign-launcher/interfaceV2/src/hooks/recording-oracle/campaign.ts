import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import recordingApi from '../../api/recordingApi';
import { useWeb3Auth } from '../../providers/Web3AuthProvider';

type JoinedCampaign = {
  id: string;
  address: string;
  chain_id: number;
  symbol: string;
  exchange_name: string;
  token: string;
  start_date: Date;
  end_date: Date;
  fund_token: string;
  fund_amount: string;
  token_decimals: number;
  token_symbol: string;
};

export const useGetUserJoinedCampaigns = () => {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useWeb3Auth();

  return useQuery({
    queryKey: ['user-joined-campaigns'],
    queryFn: () => recordingApi.get('/campaigns'),
    select: (response) =>
      (response as { campaigns: JoinedCampaign[] })?.campaigns?.map((campaign: JoinedCampaign) => ({
        id: campaign.id,
        address: campaign.address,
        chainId: campaign.chain_id,
        symbol: campaign.token,
        exchangeName: campaign.exchange_name,
        startBlock: new Date(campaign.start_date).getTime() / 1000,
        endBlock: new Date(campaign.end_date).getTime() / 1000,
        fundAmount: campaign.fund_amount,
        status: 'Pending',
        token: campaign.fund_token,
        tokenDecimals: campaign.token_decimals,
        tokenSymbol: campaign.token_symbol,
      })),
    enabled: isAuthenticated && isConnected,
  });
};
