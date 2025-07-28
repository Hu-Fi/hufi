import axios, { 
  AxiosError, 
  AxiosResponse, 
  InternalAxiosRequestConfig 
} from 'axios';

import { HttpClient, HttpClientConfig } from "./httpClient";
import { TokenData, TokenManager } from "../utils/TokenManager";

type RefreshPromise = Promise<AxiosResponse<TokenData>>;

type RecordingApiClientConfig = HttpClientConfig & {
  tokenManager: TokenManager;
};

export const REFRESH_FAILURE_EVENT = 'refresh-failure';

export class RecordingApiClient extends HttpClient {
  private refreshPromise: RefreshPromise | null = null;
  private tokenManager: TokenManager;

  constructor(config: RecordingApiClientConfig) {
    super({
      baseUrl: config.baseUrl,
    });
    this.tokenManager = config.tokenManager;

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = this.tokenManager.getAccessToken();
        if (accessToken) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401) {
          await this.performRefresh();
          return this.axiosInstance(originalRequest);
        }

        throw error;
      }
    );
  }

  private dispatchRefreshFailureEvent(): void {
    window.dispatchEvent(new Event(REFRESH_FAILURE_EVENT));
  }

  async performRefresh(): Promise<void> {
    const refreshToken = this.tokenManager.getRefreshToken();
    if (!refreshToken) {
      this.dispatchRefreshFailureEvent();
      throw new Error('No refresh token');
    }

    if (!this.refreshPromise){
      this.refreshPromise = axios.post<TokenData>(`${this.axiosInstance.defaults.baseURL}/auth/refresh`, {
        refresh_token: refreshToken,
      });
    }

    try {
      const response = await this.refreshPromise;
      const tokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };
  
      this.tokenManager.setTokens(tokens);
    } catch(e) {
      if (e instanceof AxiosError && e.response?.status === 401) {
        this.tokenManager.clearTokens();
        this.dispatchRefreshFailureEvent();
        throw new Error('Refresh token invalid');
      }
      console.error('Refresh token error');
      throw e;
    } finally {
      this.refreshPromise = null;
    }
  }

  async getNonce(address: `0x${string}` | undefined): Promise<string> {
    const response = await this.post<'signup' | string>(`/auth/nonce`, {
      address,
    });
    return response;
  }

  async auth(address: `0x${string}` | undefined, signature: `0x${string}`): Promise<TokenData> {
    const response = await this.post<TokenData>(`/auth`, {
      address,
      signature,
    });
    return response;
  }

  async logout(): Promise<void> {
    await this.post('/auth/logout', {
      refresh_token: this.tokenManager.getRefreshToken(),
    });
  }
}
