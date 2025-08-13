import { ChainId } from '@human-protocol/sdk';

export enum ExchangeType {
  CEX = 'cex',
  DEX = 'dex',
}

export enum CampaignsView {
  ALL = 'all',
  JOINED = 'joined',
  MY = 'my',
}

export enum CampaignStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export type TokenData = {
  name: string;
  label?: string;
  icon?: string;
};

export type CampaignsStats = {
  n_active_campaigns: number;
  rewards_pool_usd: string;
};

export type Exchange = {
  display_name: string;
  logo: string;
  name: string;
  type: string;
  url: string;
};

export type ExchangeApiKeyData = {
  exchange_name: string;
  api_key: string;
};

export type Campaign = {
  id: string;
  chain_id: number;
  address: `0x${string}`;
  exchange_name: string;
  trading_pair: string;
  start_date: string;
  end_date: string;
  fund_amount: string;
  fund_token: string;
  fund_token_symbol: string;
  fund_token_decimals: number;
  status: 'active' | 'cancelled' | 'completed';
  escrow_status: string;
  launcher: string;
  exchange_oracle: string;
  recording_oracle: string;
  reputation_oracle: string;
}

export type CampaignDetails = Campaign & {
  amount_paid: string;
  daily_paid_amounts: {
    date: string;
    totalAmountPaid: string;
  }[];
}

export type CampaignsResponse = {
  results: Campaign[];
  has_more: boolean;
}

export type EscrowCreateDto = {
  exchange: string;
  pair: string;
  start_date: Date;
  end_date: Date;
  fund_token: string;
  fund_amount: number;
  daily_volume_target: number;
}

export type ManifestUploadDto = {
  type: string;
  exchange: string;
  daily_volume_target: number;
  pair: string;
  start_date: string;
  end_date: string;
}

export type CampaignsQueryParams = {
  chain_id: ChainId;
  status?: CampaignStatus;
  launcher?: string;
  limit?: number;
  skip?: number;
}
