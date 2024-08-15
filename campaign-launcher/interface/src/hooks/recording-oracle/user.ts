import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { requestWithAuth } from './api';
import { useAuthentication } from './auth';
import { useNotification } from '../notification';

type RegisterExchangeAPIKeyOptions = {
  onSuccess?: () => void;
};

export const useRegisterExchangeAPIKey = ({
  onSuccess,
}: RegisterExchangeAPIKeyOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, isUserExists, signInAsync, signUpAsync } =
    useAuthentication();
  const { setNotification } = useNotification();

  const registerExchangeAPIKeyAsync = async (
    exchange: string,
    apiKey: string,
    secret: string
  ) => {
    setIsLoading(true);

    try {
      if (!isAuthenticated) {
        if (!isUserExists) {
          await signUpAsync();
        } else {
          await signInAsync();
        }
      }

      const response = await requestWithAuth('/user/exchange-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchange_name: exchange,
          api_key: apiKey,
          secret: secret,
        }),
      });

      if (!response.success) {
        throw new Error('Failed to register exchange API Key');
      }

      setNotification({
        type: 'success',
        message: 'Registered exchange API Key successfully',
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
    registerExchangeAPIKeyAsync,
  };
};

export const useUserExchangeAPIKeyExists = (exchangeName?: string) => {
  return useQuery({
    queryKey: ['user', 'exchange-api-key', exchangeName],
    queryFn: async () => {
      return await requestWithAuth(
        `/user/exchange-api-key/${exchangeName}/exists`,
        {
          method: 'GET',
        }
      );
    },
    enabled: !!exchangeName?.length,
  });
};
