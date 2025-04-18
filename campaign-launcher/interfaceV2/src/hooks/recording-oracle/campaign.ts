import { useEffect, useState } from 'react';

import { getAddress } from 'ethers';
import { useAccount } from 'wagmi';

import { requestWithAuth } from './api';
import { useAuthentication } from './auth';

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
