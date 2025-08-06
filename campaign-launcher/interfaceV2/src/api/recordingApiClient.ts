import { ChainId } from '@human-protocol/sdk';
import axios, { 
  AxiosError, 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosRequestHeaders, 
  AxiosResponse, 
  InternalAxiosRequestConfig, 
  Method
} from 'axios';

import { ExchangeApiKeyData, CampaignsResponse } from '../types';
import { HttpError } from '../utils/HttpError';
import { TokenData, TokenManager } from "../utils/TokenManager";

type RefreshPromise = Promise<AxiosResponse<TokenData>>;

type RecordingApiClientConfig = {
  baseUrl: string;
  headers?: AxiosRequestHeaders;
  tokenManager: TokenManager;
};

type PostResponse = {
  id: string;
}

export const REFRESH_FAILURE_EVENT = 'refresh-failure';

export class RecordingApiClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly tokenManager: TokenManager;
  private refreshPromise: RefreshPromise | null = null;
  
  constructor(config: RecordingApiClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
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
      }
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
        throw HttpError.fromAxiosError(e);
      }
      console.error('Error while performing tokens refresh', e);
      throw e;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async request<T = unknown>(method: Method, url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.request<T>({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch(e) {
      if (e instanceof AxiosError) {
        throw HttpError.fromAxiosError(e);
      }
      console.error('Failed to make request', e);
      throw e;
    }
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
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

  async getEnrolledExchanges(): Promise<string[]> {
    const response = await this.get<string[]>('/exchange-api-keys/exchanges');
    return response;
  }

  async getExchangesWithApiKeys(): Promise<ExchangeApiKeyData[]> {
    const response = await this.get<ExchangeApiKeyData[]>('/exchange-api-keys');
    return response;
  }

  async upsertExchangeApiKey(exchangeName: string, apiKey: string, secret: string): Promise<PostResponse> {
    const response = await this.post<PostResponse>(`/exchange-api-keys/${exchangeName}`, {
      api_key: apiKey,
      secret_key: secret,
    });
    return response;
  }

  async deleteApiKeysForExchange(exchangeName: string): Promise<void> {
    await this.delete(`/exchange-api-keys/${exchangeName}`);
  }

  async getJoinedCampaigns(): Promise<CampaignsResponse> {
    const response = await this.get<CampaignsResponse>('/campaigns');
    return response;
  }

  async joinCampaign(chainId: ChainId, address: `0x${string}`): Promise<PostResponse> {
    const response = await this.post<PostResponse>(`/campaigns/join`, {
      chain_id: chainId,
      address,
    });
    return response;
  }
}
