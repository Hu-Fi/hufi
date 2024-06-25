import { useEffect, useState } from 'react';

import { useAccount, useSignMessage } from 'wagmi';

import { request } from './api';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './constants';
import { useNotification } from '../notification';

export const useAuthentication = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUserExists, setIsUserExists] = useState(false);
  const account = useAccount();
  const { setNotification } = useNotification();
  const { signMessageAsync } = useSignMessage();

  const signInFromStorage = () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (accessToken && refreshToken) {
      setIsAuthenticated(true);
    }
  };

  const signInAsync = async () => {
    setIsLoading(true);

    try {
      const signatureContent = await request('/api/auth/prepare-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account.address,
          type: 'SIGNIN',
        }),
      }).catch(() => {
        throw new Error('Failed to prepare signature');
      });

      const signature = await signMessageAsync({
        message: JSON.stringify(signatureContent),
      });

      const authData = await request('/api/auth/web3/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account.address,
          signature,
        }),
      }).catch(() => {
        throw new Error('Failed to sign in');
      });

      localStorage.setItem(ACCESS_TOKEN_KEY, authData.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.refresh_token);

      setIsAuthenticated(true);
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUpAsync = async () => {
    setIsLoading(true);

    try {
      const signatureContent = await request('/api/auth/prepare-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account.address,
          type: 'SIGNUP',
        }),
      }).catch(() => {
        throw new Error('Failed to prepare signature');
      });

      const signature = await signMessageAsync({
        message: JSON.stringify(signatureContent),
      });

      const authData = await request('/api/auth/web3/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account.address,
          signature,
        }),
      }).catch(() => {
        throw new Error('Failed to sign up');
      });

      localStorage.setItem(ACCESS_TOKEN_KEY, authData.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.refresh_token);

      setIsAuthenticated(true);
    } catch (e) {
      setNotification({
        type: 'error',
        message: (e as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    setIsAuthenticated(false);
  };

  const checkUserExists = async () => {
    try {
      const response = await request(
        `/api/user/${account.address}/exists`
      ).catch(() => {
        throw new Error('Failed to check user existence');
      });

      setIsUserExists(response);
    } catch (e) {
      setIsUserExists(false);
    }
  };

  useEffect(() => {
    signInFromStorage();
    checkUserExists();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    isUserExists,
    signInAsync,
    signUpAsync,
    signOut,
  };
};
