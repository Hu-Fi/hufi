import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type Method,
} from 'axios';

import { BaseError } from './BaseError';

export class HttpError extends BaseError {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
  }

  static fromAxiosError(error: AxiosError<{ message?: string }>): HttpError {
    return new HttpError(
      error.response?.data?.message || error.message || 'Request failed',
      error.response?.status
    );
  }
}

export class HttpClient {
  protected readonly axiosInstance: AxiosInstance;

  constructor({ baseUrl }: { baseUrl: string }) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async request<T = unknown>(
    method: Method,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.request<T>({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (e) {
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

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }
}
