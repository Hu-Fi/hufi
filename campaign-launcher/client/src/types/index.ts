import type { ChainId } from '@human-protocol/sdk';

export type EvmAddress = `0x${string}`;

export enum ExchangeType {
  CEX = 'cex',
  DEX = 'dex',
}

export enum CampaignType {
  MARKET_MAKING = 'MARKET_MAKING',
  HOLDING = 'HOLDING',
}

export enum CampaignsView {
  ALL = 'all',
  JOINED = 'joined',
  MY = 'my',
}

export enum CampaignStatus {
  ACTIVE = 'active',
  TO_CANCEL = 'to_cancel',
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
  address: EvmAddress;
  chain_id: number;
  details: {
    daily_volume_target?: number;
    daily_balance_target?: number;
  };
  end_date: string;
  escrow_status: string;
  exchange_name: string;
  exchange_oracle: string;
  final_results_url: string | null;
  fund_amount: string;
  fund_token: string;
  fund_token_decimals: number;
  fund_token_symbol: string;
  intermediate_results_url: string | null;
  launcher: string;
  recording_oracle: string;
  reputation_oracle: string;
  start_date: string;
  status: CampaignStatus;
  symbol: string;
  type: CampaignType;
  reserved_funds: string;
};

export type CampaignDetails = Campaign & {
  amount_paid: string;
  daily_paid_amounts: {
    date: string;
    amount: string;
  }[];
  exchange_oracle_fee_percent: number;
  recording_oracle_fee_percent: number;
  reputation_oracle_fee_percent: number;
};

export type CampaignsResponse = {
  results: Campaign[];
  has_more: boolean;
};

type BaseManifestDto = {
  exchange: string;
  start_date: string;
  end_date: string;
};

export type MarketMakingManifestDto = BaseManifestDto & {
  type: CampaignType.MARKET_MAKING;
  pair: string;
  daily_volume_target: number;
};

export type HoldingManifestDto = BaseManifestDto & {
  type: CampaignType.HOLDING;
  symbol: string;
  daily_balance_target: number;
};

export type ManifestUploadDto = MarketMakingManifestDto | HoldingManifestDto;

export type CampaignsQueryParams = {
  chain_id: ChainId;
  status?: CampaignStatus;
  launcher?: string;
  limit?: number;
  skip?: number;
};

export type OracleFees = {
  exchange_oracle_fee: string;
  recording_oracle_fee: string;
  reputation_oracle_fee: string;
};

export type HoldingResult = {
  token_balance: number;
};

export type HoldingMeta = {
  total_balance: number;
};

export type MarketMakingResult = {
  total_volume: number;
};

export type MarketMakingMeta = {
  total_volume: number;
};

export type MyMeta = HoldingResult | MarketMakingResult;
export type TotalMeta = HoldingMeta | MarketMakingMeta;

export type UserProgress = {
  from: string;
  to: string;
  my_score: number;
  my_meta: MyMeta;
  total_meta: TotalMeta;
};

type BaseCampaignFormValues = {
  exchange: string;
  start_date: Date;
  end_date: Date;
  fund_token: string;
  fund_amount: number;
};

export type MarketMakingFormValues = BaseCampaignFormValues & {
  type: CampaignType.MARKET_MAKING;
  pair: string;
  daily_volume_target: number;
};

export type HoldingFormValues = BaseCampaignFormValues & {
  type: CampaignType.HOLDING;
  symbol: string;
  daily_balance_target: number;
};

export type CampaignFormValues = MarketMakingFormValues | HoldingFormValues;
