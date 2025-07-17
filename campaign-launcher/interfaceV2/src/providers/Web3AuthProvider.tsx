import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
  useEffect,
} from 'react';

import { useAccount, useSignMessage } from 'wagmi';

import { request, requestWithAuth } from '../api/recordingApi';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants';

type Nonce = 'signup' | string;

type Web3AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
};

const Web3AuthContext = createContext<Web3AuthContextType>(
  {} as Web3AuthContextType
);

export const Web3AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signMessageAsync } = useSignMessage();
  const { isConnected: isWalletConnected, address, status } = useAccount();

  const isWagmiConnected = status === 'connected';

  const getNonce = async (): Promise<Nonce> => {
    const nonce = await request(`/auth/nonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });
    return nonce; 
  };

  const getSignature = async (nonce: Nonce) => {
    return await signMessageAsync({
      message: JSON.stringify(nonce),
    });
  };

  const signIn = async () => {
    setIsLoading(true);
    try {
      const nonce = await getNonce();
      const signature = await getSignature(nonce);
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
      setIsAuthenticated(false);
      console.error(e);
      throw new Error('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuthToken = async () => {
    const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refresh_token) {
      throw new Error('No refresh token available');
    }

    setIsLoading(true);

    try {
      const authData = await request('/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token }),
      });
  
      localStorage.setItem(ACCESS_TOKEN_KEY, authData.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.refresh_token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Refresh token invalid, clearing tokens');
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
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
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isWalletConnected && !isAuthenticated && isWagmiConnected) {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      !accessToken ? signIn() : refreshAuthToken();
    }
  }, [isWalletConnected, address, isWagmiConnected]);

  return (
    <Web3AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        signIn,
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
