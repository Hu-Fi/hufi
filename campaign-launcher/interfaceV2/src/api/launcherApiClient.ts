import { ChainId } from "@human-protocol/sdk";
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, Method } from "axios";

import { CampaignDetails, CampaignsResponse, Exchange } from "../types";
import { HttpError } from "../utils/HttpError";

export class LauncherApiClient  {
  private readonly axiosInstance: AxiosInstance;

  constructor({ baseUrl }: { baseUrl: string }) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      }
    });
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

  async getTradingPairs(exchangeName: string): Promise<string[]> {
    return this.get<string[]>(`/exchanges/${exchangeName}/trading-pairs`);
  }

  async getExchanges(): Promise<Exchange[]> {
    const response = await this.get<Exchange[]>('/exchanges');
    return response;
  }

  async getCampaigns(params: Record<string, string | number>): Promise<CampaignsResponse> {
    const response = await this.get<CampaignsResponse>('/campaigns', { params });
    return response;
  }

  async getCampaignDetails(chainId: ChainId, address: string): Promise<CampaignDetails | null> {
    try {
      const response = await this.get<CampaignDetails>(`/campaigns/${chainId}-${address}`);
      return response;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

