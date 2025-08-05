import { ChainId } from '@human-protocol/sdk';

export enum ExchangeType {
  CEX = 'cex',
  DEX = 'dex',
}

export type TokenData = {
  name: string;
  label?: string;
  icon?: string;
};

type Chain = {
  averageFundingUSD: number;
  chainId: ChainId;
  chainName: string;
  campaigns: number;
  totalFundsUSD: number;
};

export type CampaignsStats = {
  totalCampaigns: number;
  totalFundsUSD: number;
  averageFundingUSD: number;
  chains: Chain[];
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
  chain_id: number;
  address: string;
  exchange_name: string;
  trading_pair: string;
  start_date: string;
  end_date: string;
  fund_amount: string;
  fund_token: string;
  fund_token_symbol: string;
  fund_token_decimals: number;
  status: string;
  launcher: string;
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
}

export type ManifestUploadDto = {
  type: string;
  exchange: string;
  daily_volume_target: number;
  pair: string;
  fund_token: string;
  start_date: string;
  end_date: string;
}
