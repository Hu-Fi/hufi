import { ChainId } from "@human-protocol/sdk";

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
} 
