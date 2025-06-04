import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useAccount, useSignMessage } from 'wagmi';

import { request } from '../api/recordingApi';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants';

type AuthenticationContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isUserExists: boolean;
  signInAsync: () => Promise<void>;
  signUpAsync: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthenticationContext = createContext<AuthenticationContextType>(
  {} as AuthenticationContextType
);

export const AuthenticationProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUserExists, setIsUserExists] = useState(false);
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();

  const signInFromStorage = (): boolean => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (accessToken && refreshToken) {
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const signInAsync = async () => {
    setIsLoading(true);

    try {
      const signatureContent = await request('/auth/prepare-signature', {
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

      const authData = await request('/auth/web3/signin', {
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
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const signUpAsync = async () => {
    setIsLoading(true);

    try {
      const signatureContent = await request('/auth/prepare-signature', {
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

      const authData = await request('/auth/web3/signup', {
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
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    setIsAuthenticated(false);
  };

  const checkUserExists = async (): Promise<boolean> => {
    try {
      const response = await request(`/user/${account.address}/exists`).catch(
        () => {
          throw new Error('Failed to check user existence');
        }
      );

      setIsUserExists(response);

      return response;
    } catch (e) {
      setIsUserExists(false);
      return false;
    }
  };

  useEffect(() => {
    if (account.address) {
      if (signInFromStorage()) {
        return;
      }

      (async () => {
        const isExists = await checkUserExists();
        if (isExists && !isAuthenticated) {
          await signInAsync();
        }
      })();
    }
  }, [account.address]);

  return (
    <AuthenticationContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isUserExists,
        signInAsync,
        signUpAsync,
        signOut,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};

export const useAuthentication = () => {
  return useContext(AuthenticationContext);
};
