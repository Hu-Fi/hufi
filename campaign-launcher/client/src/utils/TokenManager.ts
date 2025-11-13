import { jwtDecode } from 'jwt-decode';

export type TokenData = {
  access_token: string;
  refresh_token: string;
};

const TOKEN_DATA_KEY = 'ro-token-data';

export type TokenStorageSyncListener = (newTokenData: TokenData | null) => void;

export class TokenManager {
  private static instance: TokenManager;

  private storageSyncListeners = new Set<TokenStorageSyncListener>();

  private constructor() {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === TOKEN_DATA_KEY) {
        for (const listener of this.storageSyncListeners.values()) {
          try {
            listener(this.getTokens());
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

  private getTokens(): TokenData | null {
    const tokenDataItem = localStorage.getItem(TOKEN_DATA_KEY);

    return tokenDataItem ? JSON.parse(tokenDataItem) : null;
  }

  setTokens(tokenData: TokenData) {
    if (!tokenData || !tokenData.access_token || !tokenData.refresh_token) {
      throw new Error('Token data is incomplete');
    }

    localStorage.setItem(TOKEN_DATA_KEY, JSON.stringify(tokenData));
  }

  clearTokens(): void {
    localStorage.removeItem(TOKEN_DATA_KEY);
  }

  getAccessToken(): string | null {
    return this.getTokens()?.access_token || null;
  }

  getRefreshToken(): string | null {
    return this.getTokens()?.refresh_token || null;
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
