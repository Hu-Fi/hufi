import { useEffect, useState } from 'react';

import { getAddress } from 'ethers';
import { useAccount } from 'wagmi';

import { requestWithAuth } from './api';
import { useAuthentication } from './auth';
import { useNotification } from '../notification';

type JoinCampaignOptions = {
  onSuccess?: () => void;
};

export const useJoinCampaign = ({ onSuccess }: JoinCampaignOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, isUserExists, signInAsync, signUpAsync } =
    useAuthentication();
  const account = useAccount();
  const { setNotification } = useNotification();

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

      setNotification({
        type: 'success',
        message: 'Joined campaign successfully',
      });

      onSuccess?.();
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });
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
  const { setNotification } = useNotification();
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
      }
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });
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
