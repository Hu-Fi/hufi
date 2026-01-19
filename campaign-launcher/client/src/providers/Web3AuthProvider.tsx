import {
  type FC,
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useConnection, useSignMessage } from 'wagmi';

import { recordingApi } from '@/api';
import { REFRESH_FAILURE_EVENT } from '@/api/recordingApiClient';
import SignInPromptModal from '@/components/modals/SignInPromptModal';
import { AUTHED_QUERY_TAG } from '@/constants/queryKeys';
import useCheckApiKeysValidity from '@/hooks/useCheckApiKeysValidity';
import { tokenManager } from '@/utils/TokenManager';

import { useActiveAccount } from './ActiveAccountProvider';

type SetAuthenticationStateOptions = Partial<{
  clearQueryCache: boolean;
  clearTokens: boolean;
}>;

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

  const queryClient = useQueryClient();
  const signMessage = useSignMessage();
  const { isConnected } = useConnection();
  const { activeAddress } = useActiveAccount();
  const { checkApiKeysValidity } = useCheckApiKeysValidity();

  const setAuthenticationState = useCallback(
    (
      _isAuthenticated: boolean,
      options: SetAuthenticationStateOptions = {}
    ) => {
      setIsAuthenticated(_isAuthenticated);

      const _options = Object.assign<
        Required<SetAuthenticationStateOptions>,
        SetAuthenticationStateOptions
      >(
        {
          clearQueryCache: true,
          clearTokens: true,
        },
        options
      );
      if (!_isAuthenticated) {
        if (_options.clearTokens) {
          tokenManager.clearTokens();
        }

        if (_options.clearQueryCache) {
          queryClient.removeQueries({
            predicate: (query) => query.queryKey.includes(AUTHED_QUERY_TAG),
          });
        }
      }
    },
    [queryClient]
  );

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const nonce = await recordingApi.getNonce(activeAddress);
      const signature = await signMessage.mutateAsync({
        account: activeAddress,
        message: JSON.stringify(nonce),
      });
      const authResponse = await recordingApi.auth(activeAddress, signature);

      tokenManager.setTokens({
        access_token: authResponse.access_token,
        refresh_token: authResponse.refresh_token,
      });
      setAuthenticationState(true);
      checkApiKeysValidity();
    } catch (e) {
      setAuthenticationState(false);
      console.error('Failed to sign in', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [
    activeAddress,
    signMessage,
    setAuthenticationState,
    checkApiKeysValidity,
  ]);

  const bootstrapAuthState = useCallback(async () => {
    if (!tokenManager.hasTokens()) {
      setIsLoading(false);
      return;
    }

    if (tokenManager.isAboutToExpire()) {
      setIsLoading(true);

      try {
        await recordingApi.performRefresh();
        setAuthenticationState(true);
      } catch (e) {
        setAuthenticationState(false);
        console.error('Failed to refresh token', e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setAuthenticationState(true);
    }
  }, [setAuthenticationState]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await recordingApi.logout();
    } catch (e) {
      console.error('Logout request failed', e);
    } finally {
      setAuthenticationState(false);
      setIsLoading(false);
    }
  }, [setAuthenticationState]);

  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      bootstrapAuthState();
    } else {
      setIsLoading(false);
    }
  }, [
    isConnected,
    isAuthenticated,
    bootstrapAuthState,
    setAuthenticationState,
  ]);

  useEffect(() => {
    const handleRefreshFailureEvent = () => {
      if (isAuthenticated) {
        setAuthenticationState(false);
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
  }, [setAuthenticationState]);

  useEffect(() => {
    const handleTokenStorageSync = () => {
      const _isAuthenticated = tokenManager.hasTokens();
      setAuthenticationState(_isAuthenticated, { clearTokens: false });
    };

    tokenManager.addStorageSyncListener(handleTokenStorageSync);
    return () => tokenManager.removeStorageSyncListener(handleTokenStorageSync);
  }, [setAuthenticationState]);

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
