import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
  useEffect,
} from 'react';

import { useAccount, useSignMessage } from 'wagmi';

import { REFRESH_FAILURE_EVENT } from '../api/httpClient';
import recordingApi from '../api/recordingApi';
import { tokenManager, TokenData } from '../utils/TokenManager';

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

const getNonce = async (address: `0x${string}` | undefined) => {
  const response = await recordingApi.post<Nonce>(`/auth/nonce`, { address });
  return response.data; 
};

export const Web3AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signMessageAsync } = useSignMessage();
  const { isConnected, address } = useAccount();

  const signIn = async () => {
    setIsLoading(true);
    try {
      const nonce = await getNonce(address);
      const signature = await signMessageAsync({
        message: JSON.stringify(nonce),
      });
      const authResponse = await recordingApi.post<TokenData>('/auth', {
        address,
        signature,
      });

      tokenManager.setTokens({
        access_token: authResponse.data.access_token,
        refresh_token: authResponse.data.refresh_token,
      });
      setIsAuthenticated(true);
    } catch(e) {
      setIsAuthenticated(false);
      console.error(e);
      throw new Error('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const validateAuthState = async () => {
    const access_token = tokenManager.getAccessToken();
    const refresh_token = tokenManager.getRefreshToken();

    if (!refresh_token || !access_token) {
      return;
    }
    
    if (tokenManager.isAboutToExpire()) {
      setIsLoading(true);

      try {
        await recordingApi.performRefresh();
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await recordingApi.post('/auth/logout', {
        refresh_token: tokenManager.getRefreshToken(),
      });
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      tokenManager.clearTokens();
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      validateAuthState();
    }
  }, [isConnected, isAuthenticated]);

  useEffect(() => {
    const handleRefreshFailure = () => {
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    window.addEventListener(REFRESH_FAILURE_EVENT, handleRefreshFailure);

    return () => {
      window.removeEventListener(REFRESH_FAILURE_EVENT, handleRefreshFailure);
    };
  }, []);

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
