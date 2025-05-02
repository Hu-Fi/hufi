import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { getAddress } from 'ethers';
import { useAccount } from 'wagmi';

import { requestWithAuth } from '../../api/recordingApi';
import { useAuthentication } from '../../providers/AuthProvider';

type JoinCampaignOptions = {
  onSuccess?: () => void;
};

export const useJoinCampaign = ({ onSuccess }: JoinCampaignOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    isAuthenticated,
    isUserExists,
    signInAsync,
    signUpAsync,
  } = useAuthentication();
  const account = useAccount();

  const joinCampaignAsync = async (campaignAddress: string) => {
    setIsLoading(true);

    try {
      if (!isAuthenticated) {
        if (!isUserExists) {
          await signUpAsync();
        } else {
          await signInAsync();
        }
      }

      const response = await requestWithAuth('/user/campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chain_id: account.chainId,
          address: getAddress(campaignAddress),
        }),
      });

      if (!response.success) {
        throw new Error('Failed to join campaign');
      }

      onSuccess?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    joinCampaignAsync,
  };
};

export const useUserCampaignStatus = (address: string) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuthentication();

  const fetchUserCampaignStatus = async () => {
    setIsLoading(true);

    try {
      if (isAuthenticated) {
        const response = await requestWithAuth(
          `/user/campaign/${getAddress(address)}`,
          {
            method: 'GET',
          }
        );

        setIsRegistered(response);
      } else {
        setIsRegistered(false);
      }
    } catch (e) {
      setIsRegistered(false);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCampaignStatus();
  }, [isAuthenticated]);

  return {
    isRegistered,
    isLoading,
    fetchUserCampaignStatus,
  };
};

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
};

export const useGetUserJoinedCampaigns = (chainId: number | undefined) => {
  const { isAuthenticated } = useAuthentication();

  return useQuery({
    queryKey: ['user-joined-campaigns', chainId],
    queryFn: () =>
      requestWithAuth(`/user/joined-campaigns/${chainId}`, {
        method: 'GET',
      }),
    select: (data) =>
      data?.map((campaign: JoinedCampaign) => ({
        id: campaign.id,
        address: campaign.address,
        chainId: campaign.chain_id,
        symbol: campaign.token,
        exchangeName: campaign.exchange_name,
        startBlock: new Date(campaign.start_date).getTime() / 1000,
        endBlock: new Date(campaign.end_date).getTime() / 1000,
        fundAmount: campaign.fund_amount,
        status: 'Pending',
      })),
    enabled: !!chainId && isAuthenticated,
  });
};
