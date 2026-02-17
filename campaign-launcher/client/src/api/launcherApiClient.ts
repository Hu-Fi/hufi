import type { ChainId } from '@human-protocol/sdk';

import type {
  CampaignDailyPaidAmounts,
  CampaignDetails,
  CampaignsResponse,
  CampaignsStats,
  Exchange,
  OracleFees,
} from '@/types';
import { HttpClient, HttpError } from '@/utils/HttpClient';

export class LauncherApiClient extends HttpClient {
  constructor({ baseUrl }: { baseUrl: string }) {
    super({ baseUrl });
  }

  async getTradingPairs(exchangeName: string): Promise<string[]> {
    return this.get<string[]>(`/exchanges/${exchangeName}/trading-pairs`);
  }

  async getExchangeCurrencies(exchangeName: string): Promise<string[]> {
    return this.get<string[]>(`/exchanges/${exchangeName}/currencies`);
  }

  async getExchanges(): Promise<Exchange[]> {
    const response = await this.get<Exchange[]>('/exchanges');
    return response;
  }

  async getCampaigns(
    params: Record<string, string | number>,
    signal?: AbortSignal
  ): Promise<CampaignsResponse> {
    const response = await this.get<CampaignsResponse>('/campaigns', {
      params,
      signal,
    });
    return response;
  }

  async getCampaignDetails(
    chainId: ChainId,
    address: string
  ): Promise<CampaignDetails | null> {
    try {
      const response = await this.get<CampaignDetails>(
        `/campaigns/${chainId}-${address}`
      );
      return response;
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getCampaignsStats(chain_id: ChainId): Promise<CampaignsStats> {
    const response = await this.get<CampaignsStats>('/stats/campaigns', {
      params: { chain_id },
    });
    return response;
  }

  async getOracleFees(chain_id: ChainId): Promise<OracleFees> {
    const response = await this.get<OracleFees>('/web3/oracle-fees', {
      params: { chain_id },
    });
    return response;
  }

  async getCampaignDailyPaidAmounts(
    chainId: ChainId,
    campaignAddress: string
  ): Promise<CampaignDailyPaidAmounts> {
    const response = await this.get<CampaignDailyPaidAmounts>(
      `/campaigns/${chainId}-${campaignAddress}/daily-paid-amounts`
    );
    return response;
  }
}
