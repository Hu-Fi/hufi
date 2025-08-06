import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { useTheme } from '@mui/material';

import {
  USDT_CONTRACT_ADDRESS,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  LOCALHOST_CHAIN_IDS,
} from '../constants';
import { CHAIN_ICONS } from '../constants/chainIcons';
import { Campaign, CampaignDetails, EscrowCreateDto } from '../types';

export const formatAddress = (address?: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-5)}`;
};

export const getTokenAddress = (
  chainId: ChainId,
  name: string
): string | undefined => {
  switch (name) {
    case 'usdt':
      return USDT_CONTRACT_ADDRESS[chainId];
    case 'hmt':
      return NETWORKS[chainId]?.hmtAddress;
  }
};

export const getSupportedChainIds = (): ChainId[] => {
  switch (import.meta.env.VITE_APP_WEB3_ENV) {
    case 'mainnet':
      return MAINNET_CHAIN_IDS;
    case 'testnet':
      return TESTNET_CHAIN_IDS;
    default:
      return LOCALHOST_CHAIN_IDS;
  }
};

export const explorerBaseUrls: Partial<Record<ChainId, string>> = {
  1: 'https://etherscan.io',
  137: 'https://polygonscan.com',
  80002: 'https://amoy.polygonscan.com',
  11155111: 'https://sepolia.etherscan.io',
};

export const getExplorerUrl = (chainId: ChainId, address: string): string => {
  const baseUrl = explorerBaseUrls[chainId];
  
  if (baseUrl) {
    return `${baseUrl}/address/${address}`;
  }

  return `https://polygonscan.com/address/${address}`;
};

export const formatTokenAmount = (amount: string | number, decimals = 18): string | number => {
  const formattedAmount = +amount / Math.pow(10, decimals);
  
  if (formattedAmount >= 1000) {
    return Math.round(formattedAmount);
  } else {
    return parseFloat(formattedAmount.toFixed(4));
  }
};

export const mapStatusToColor = (status: Campaign['status'], startDate: string, endDate: string) => {
  const theme = useTheme();
  const today = new Date().toISOString();

  switch (status) {
    case 'active':
      if (today < startDate) {
        return theme.palette.warning.main;
      } else if (today > endDate) {
        return theme.palette.error.main;
      } else {
        return theme.palette.success.main;
      }
    case 'cancelled':
      return theme.palette.primary.main;
    case 'completed':
      return theme.palette.secondary.main;
    default:
      return theme.palette.primary.main;
  }
};

export const getChainIcon = (id?: ChainId) => {
  if (!id) return null;
  return CHAIN_ICONS[id] || null;
};

export const getNetworkName = (chainId?: ChainId): string | undefined => {
  if (!chainId) return undefined;
  return NETWORKS[chainId]?.title;
};


export const isCampaignDetails = (obj: unknown): obj is CampaignDetails => {
  if (!obj || typeof obj !== 'object') return false;
  
  const requiredCampaignFields = [
    'id', 'chain_id', 'address', 'exchange_name', 'trading_pair',
    'start_date', 'end_date', 'fund_amount', 'fund_token', 
    'fund_token_symbol', 'fund_token_decimals', 'status',
    'escrow_status', 'launcher', 'exchange_oracle', 
    'recording_oracle', 'reputation_oracle', 'amount_paid', 'daily_paid_amounts'
  ];
  
  for (const field of requiredCampaignFields) {
    if (!(field in obj)) return false;
  }
  
  return true;
};

export const constructCampaignDetails = (chainId: ChainId, address: string, data: EscrowCreateDto) => {
  return {
    id: address,
    chain_id: chainId,
    address: address,
    exchange_name: data.exchange,
    trading_pair: data.pair,
    start_date: data.start_date,
    end_date: data.end_date,
    fund_amount: data.fund_amount,
    fund_token: '',
    fund_token_symbol: data.fund_token.toUpperCase(),
    fund_token_decimals: 0,
    status: 'active',
    escrow_status: 'pending',
    launcher: address,
    exchange_oracle: '',
    recording_oracle: '',
    reputation_oracle: '',
    amount_paid: '0',
    daily_paid_amounts: [],
  }
}
