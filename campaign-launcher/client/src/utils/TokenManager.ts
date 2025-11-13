import { jwtDecode } from 'jwt-decode';

export type TokenData = {
  access_token: string;
  refresh_token: string;
};

export const TOKEN_DATA_KEY = 'ro-token-data';

export class TokenManager {
  private static instance: TokenManager;

  private constructor() {}

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
}

export const tokenManager = TokenManager.getInstance();
