import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
  useEffect,
} from 'react';

import { useAccount, useSignMessage } from 'wagmi';

import axiosInstance from '../api/recordingApi';
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
    const response = await axiosInstance.post(`/auth/nonce`, { address });
    return response.data; 
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
      const authResponse = await axiosInstance.post('/auth', {
        address,
        signature,
      });

      localStorage.setItem(ACCESS_TOKEN_KEY, authResponse.data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.data.refresh_token);
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
    const access_token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refresh_token || !access_token) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/auth/refresh', {
        refresh_token,
      });

      localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      console.log('Error:', error);
      console.error('Refresh token invalid, clearing tokens');
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await axiosInstance.post('/auth/logout');
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
      refreshAuthToken();
    }
  }, [isWalletConnected, isWagmiConnected]);

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
