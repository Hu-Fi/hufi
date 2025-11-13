import { jwtDecode } from 'jwt-decode';

export type TokenData = {
  access_token: string;
  refresh_token: string;
};

const ACCESS_TOKEN_KEY = 'ro-access-token';
const REFRESH_TOKEN_KEY = 'ro-refresh-token';

type TokenDataKey = keyof TokenData;
type SyncEventTokenData = {
  [K in TokenDataKey]: {
    key: K;
    oldValue: TokenData[K] | null;
    newValue: TokenData[K] | null;
  };
}[TokenDataKey];
export type TokenStorageSyncListener = (
  newTokenData: SyncEventTokenData
) => void;

export class TokenManager {
  private static instance: TokenManager;

  private storageSyncListeners = new Set<TokenStorageSyncListener>();

  private constructor() {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (!event.key) {
        return;
      }

      if ([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY].includes(event.key)) {
        for (const listener of this.storageSyncListeners.values()) {
          try {
            listener({
              key: event.key as TokenDataKey,
              oldValue: event.oldValue,
              newValue: event.newValue,
            });
          } catch {
            // noop
          }
        }
      }
    });
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(tokens: TokenData): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }

  isAboutToExpire(seconds = 60): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token');
    }

    const decodedAccessToken = jwtDecode<{ exp: number }>(accessToken);
    const currentTime = Math.ceil(Date.now() / 1000);
    const timeUntilExpiry = decodedAccessToken.exp - currentTime;

    return timeUntilExpiry < seconds;
  }

  addStorageSyncListener(listener: TokenStorageSyncListener): void {
    if (this.storageSyncListeners.has(listener)) {
      console.warn('Token storage sync listener already added', listener);
    } else {
      this.storageSyncListeners.add(listener);
    }
  }

  removeStorageSyncListener(listener: TokenStorageSyncListener): void {
    if (this.storageSyncListeners.has(listener)) {
      this.storageSyncListeners.delete(listener);
    } else {
      console.warn('Token storage sync listener not attached', listener);
    }
  }
}

export const tokenManager = TokenManager.getInstance();
