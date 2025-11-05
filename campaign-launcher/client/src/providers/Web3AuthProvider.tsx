import {
  type FC,
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from 'react';

import { useAccount, useSignMessage } from 'wagmi';

import { recordingApi } from '@/api';
import { REFRESH_FAILURE_EVENT } from '@/api/recordingApiClient';
import SignInPromptModal from '@/components/modals/SignInPromptModal';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  tokenManager,
} from '@/utils/TokenManager';

import { useActiveAccount } from './ActiveAccountProvider';

type Web3AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  setShowSignInPrompt: (show: boolean) => void;
};

const Web3AuthContext = createContext<Web3AuthContextType>(
  {} as Web3AuthContextType
);

export const Web3AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const { signMessageAsync } = useSignMessage();
  const { isConnected } = useAccount();
  const { activeAddress } = useActiveAccount();

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const nonce = await recordingApi.getNonce(activeAddress);
      const signature = await signMessageAsync({
        account: activeAddress,
        message: JSON.stringify(nonce),
      });
      const authResponse = await recordingApi.auth(activeAddress, signature);

      tokenManager.setTokens({
        access_token: authResponse.access_token,
        refresh_token: authResponse.refresh_token,
      });
      setIsAuthenticated(true);
    } catch (e) {
      setIsAuthenticated(false);
      console.error('Failed to sign in', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeAddress, signMessageAsync]);

  const bootstrapAuthState = async () => {
    const access_token = tokenManager.getAccessToken();
    const refresh_token = tokenManager.getRefreshToken();

    if (!refresh_token || !access_token) {
      setIsLoading(false);
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

  const logout = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      bootstrapAuthState();
    } else {
      setIsLoading(false);
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
      window.removeEventListener(
        REFRESH_FAILURE_EVENT,
        handleRefreshFailureEvent
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key &&
        [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY].includes(event.key)
      ) {
        const _isAuthenticated = tokenManager.hasTokens();
        setIsAuthenticated(_isAuthenticated);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Web3AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        signIn,
        logout,
        setShowSignInPrompt,
      }}
    >
      {children}
      <SignInPromptModal
        open={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
      />
    </Web3AuthContext.Provider>
  );
};

export const useWeb3Auth = () => {
  return useContext(Web3AuthContext);
};
