import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type Method,
} from 'axios';

import { BaseError } from './BaseError';

type HttpErrorDetails = {
  responseMessage?: string;
  [responseDetails: string]: unknown;
};
export class HttpError extends BaseError {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: HttpErrorDetails
  ) {
    super(message);
  }

  static fromAxiosError(
    error: AxiosError<{ message?: string; details?: object }>
  ): HttpError {
    let details: HttpErrorDetails | undefined;
    if (
      error.response?.status &&
      error.response.status < 500 &&
      error.response?.data
    ) {
      details = {
        responseMessage: error.response.data.message,
        ...error.response.data.details,
      };
    }

    return new HttpError(
      error.message || 'Request failed',
      error.response?.status,
      details
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

      if (response.status === 204) {
        /**
         * According to fetch specs, it returns empty string
         * as response data when no content in body
         */
        return undefined as unknown as T;
      }

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
