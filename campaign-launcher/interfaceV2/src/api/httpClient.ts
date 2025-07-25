import axios, { 
  AxiosError, 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosRequestHeaders, 
  AxiosResponse, 
  InternalAxiosRequestConfig 
} from 'axios';

import { tokenManager, TokenData } from '../utils/TokenManager';

type HttpClientConfig = {
  baseURL: string;
  headers?: AxiosRequestHeaders;
};

type RefreshPromise = Promise<AxiosResponse<TokenData>>;

export const REFRESH_FAILURE_EVENT = 'refresh-failure';

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private refreshPromise: RefreshPromise | null = null;

  constructor(config: HttpClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = tokenManager.getAccessToken();
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

  private dispatchRefreshFailure(): void {
    window.dispatchEvent(new CustomEvent(REFRESH_FAILURE_EVENT, {
      detail: 'refresh_failed',
    }));
  }

  async performRefresh(): Promise<void> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      this.dispatchRefreshFailure();
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
  
      tokenManager.setTokens(tokens);
    } catch(e) {
      if (e instanceof AxiosError && e.response?.status === 401) {
        tokenManager.clearTokens();
        this.dispatchRefreshFailure();
        throw new Error('Refresh token invalid');
      }
      console.error('Refresh token error', e);
      throw e;
    } finally {
      this.refreshPromise = null;
    }
  }

  get<T = unknown, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
    return this.axiosInstance.get<T, R>(url, config);
  }

  post<T = unknown, R = AxiosResponse<T>>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<R> {
    return this.axiosInstance.post<T, R>(url, data, config);
  }

  put<T = unknown, R = AxiosResponse<T>>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<R> {
    return this.axiosInstance.put<T, R>(url, data, config);
  }

  patch<T = unknown, R = AxiosResponse<T>>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<R> {
    return this.axiosInstance.patch<T, R>(url, data, config);
  }

  delete<T = unknown, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
    return this.axiosInstance.delete<T, R>(url, config);
  }
} 