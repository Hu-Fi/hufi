import { ChainId } from "@human-protocol/sdk";

import { CampaignDetails, CampaignsResponse, CampaignsStats, Exchange } from "../types";
import { HttpClient, HttpError } from "../utils/HttpClient";

export class LauncherApiClient extends HttpClient {
  constructor({ baseUrl }: { baseUrl: string }) {
    super({ baseUrl });
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
      if (error instanceof HttpError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getCampaignsStats(chain_id: ChainId): Promise<CampaignsStats> {
    const response = await this.get<CampaignsStats>(`/stats/campaigns`, { params: { chain_id } });
    return response;
  }
}

