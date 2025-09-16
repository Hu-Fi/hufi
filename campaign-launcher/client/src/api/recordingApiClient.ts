import { ChainId } from '@human-protocol/sdk';
import axios, { AxiosError, AxiosRequestHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { ExchangeApiKeyData, CampaignsResponse, UserProgress } from '../types';
import { HttpClient, HttpError } from '../utils/HttpClient';
import { TokenData, TokenManager } from "../utils/TokenManager";

type RefreshPromise = Promise<AxiosResponse<TokenData>>;

type RecordingApiClientConfig = {
  baseUrl: string;
  headers?: AxiosRequestHeaders;
  tokenManager: TokenManager;
};

export const REFRESH_FAILURE_EVENT = 'refresh-failure';

export class RecordingApiClient extends HttpClient {
  private readonly tokenManager: TokenManager;
  private refreshPromise: RefreshPromise | null = null;
  
  constructor(config: RecordingApiClientConfig) {
    super({ baseUrl: config.baseUrl });
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

  async getNonce(address: `0x${string}` | undefined): Promise<string> {
    const response = await this.post<'signup' | string>('/auth/nonce', {
      address,
    });
    return response;
  }

  async auth(address: `0x${string}` | undefined, signature: `0x${string}`): Promise<TokenData> {
    const response = await this.post<TokenData>('/auth', {
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

  async upsertExchangeApiKey(exchangeName: string, apiKey: string, secret: string): Promise<void> {
    await this.post<void>(`/exchange-api-keys/${exchangeName}`, {
      api_key: apiKey,
      secret_key: secret,
    });
  }

  async deleteApiKeysForExchange(exchangeName: string): Promise<void> {
    await this.delete(`/exchange-api-keys/${exchangeName}`);
  }

  async getJoinedCampaigns(params: Record<string, string | number>): Promise<CampaignsResponse> {
    const response = await this.get<CampaignsResponse>('/campaigns', { params });
    return response;
  }

  async joinCampaign(chain_id: ChainId, address: `0x${string}`): Promise<void> {
    await this.post<void>('/campaigns/join', {
      chain_id,
      address,
    });
  }

  async getTotalVolume(exchange_name: string): Promise<{ total_volume: number }> {
    const response = await this.get<{ total_volume: number }>(
      '/stats/total-volume',
      exchange_name ? { params: { exchange_name } } : {}
    );
    return response;
  }

  async checkIsJoinedCampaign(chain_id: ChainId, address: `0x${string}`): Promise<{is_joined: boolean}> {
    const response = await this.post<{is_joined: boolean}>('/campaigns/check-is-joined', {
      chain_id,
      address,
    });
    return response;
  }

  async getUserProgress(chain_id: ChainId, campaign_address: `0x${string}`): Promise<UserProgress>{
    const response = await this.get<UserProgress>(`/campaigns/${chain_id}-${campaign_address}/my-progress`, {
      params: {
        chain_id,
        campaign_address,
      },
    });

    return response;
  }
}
