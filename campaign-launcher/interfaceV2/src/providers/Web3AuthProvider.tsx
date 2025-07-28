import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
  useEffect,
} from 'react';

import { useAccount, useSignMessage } from 'wagmi';

import { recordingApi } from '../api';
import { REFRESH_FAILURE_EVENT } from '../api/recordingApiClient';
import { tokenManager } from '../utils/TokenManager';

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
  const { isConnected, address } = useAccount();

  const signIn = async () => {
    setIsLoading(true);
    try {
      const nonce = await recordingApi.getNonce(address);
      const signature = await signMessageAsync({
        message: JSON.stringify(nonce),
      });
      const authResponse = await recordingApi.auth(address, signature);

      tokenManager.setTokens({
        access_token: authResponse.access_token,
        refresh_token: authResponse.refresh_token,
      });
      setIsAuthenticated(true);
    } catch(e) {
      setIsAuthenticated(false);
      console.error('Failed to sign in', e);
    } finally {
      setIsLoading(false);
    }
  };

  const bootstrapAuthState = async () => {
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
      } catch (e) {
        setIsAuthenticated(false);
        console.error('Failed to refresh token', e);
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
      await recordingApi.logout();
    } catch (e) {
      console.error('Logout request failed', e);
    } finally {
      tokenManager.clearTokens();
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      bootstrapAuthState();
    }
  }, [isConnected, isAuthenticated]);

  useEffect(() => {
    const handleRefreshFailureEvent = () => {
      if (isAuthenticated) {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    window.addEventListener(REFRESH_FAILURE_EVENT, handleRefreshFailureEvent);

    return () => {
      window.removeEventListener(REFRESH_FAILURE_EVENT, handleRefreshFailureEvent);
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
