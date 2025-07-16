import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from 'react';

import { useSignMessage } from 'wagmi';

import { request, requestWithAuth } from '../api/recordingApi';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants';

type Web3AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (address: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
};

const Web3AuthContext = createContext<Web3AuthContextType>(
  {} as Web3AuthContextType
);

export const Web3AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signMessageAsync } = useSignMessage();

  const getNonce = async (address: string) => {
    const nonce = await request(`/auth/nonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });
    return nonce; // 'signup' | nonce
  };

  const getSignature = async (nonce: string) => {
    return await signMessageAsync({
      message: JSON.stringify(nonce),
    });
  };

  const signIn = async (address: string) => { 
    console.log('here');
    setIsLoading(true);
    try {
      const nonce = await getNonce(address);
      console.log('1', nonce);
      const signature = await getSignature(nonce);
      console.log('2', signature);
      const authData = await request('/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, signature }),
      });

      localStorage.setItem(ACCESS_TOKEN_KEY, authData.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.refresh_token);
      setIsAuthenticated(true);
    } catch(e) {
      console.error(e);
      throw new Error('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
    
  };

  const refreshToken = async () => {
    const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return;
    const authData = await request('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token }),
    });

    localStorage.setItem(ACCESS_TOKEN_KEY, authData.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, authData.refresh_token);

    return authData;
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await requestWithAuth('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setIsAuthenticated(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Web3AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        signIn,
        refreshToken,
        logout,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
};

export const useWeb3Auth = () => {
  return useContext(Web3AuthContext);
};
