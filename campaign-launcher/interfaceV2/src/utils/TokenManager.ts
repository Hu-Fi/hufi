import { decodeJwt } from '.';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants';

export type TokenData = {
  access_token: string;
  refresh_token: string;
};

export class TokenManager {
  private static instance: TokenManager;

  private constructor() {}

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

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
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

    const decodedAccessToken = decodeJwt<{ exp: number }>(accessToken);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decodedAccessToken.exp - currentTime;

    return timeUntilExpiry < seconds;
  }
}

export const tokenManager = TokenManager.getInstance(); 