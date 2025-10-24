import { NETWORKS, type ChainId } from '@human-protocol/sdk';
import { ethers, formatUnits } from 'ethers';

import {
  USDC_CONTRACT_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  LOCALHOST_CHAIN_IDS,
} from '@/constants';
import { CHAIN_ICONS } from '@/constants/chainIcons';
import { TOKENS } from '@/constants/tokens';
import createAppTheme from '@/theme';
import {
  CampaignStatus,
  CampaignType,
  type Campaign,
  type CampaignDetails,
  type CampaignFormValues,
} from '@/types';

export const formatAddress = (address?: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-5)}`;
};

export const getTokenAddress = (
  chainId: ChainId,
  name: string
): string | undefined => {
  switch (name) {
    case 'hmt':
      return NETWORKS[chainId]?.hmtAddress;
    case 'usdt':
      return USDT_CONTRACT_ADDRESS[chainId];
    case 'usdc':
      return USDC_CONTRACT_ADDRESS[chainId];
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

export const formatTokenAmount = (
  amount: string | number,
  decimals = 18
): string | number => {
  const bigIntAmount = BigInt(amount);
  const amountString = formatUnits(bigIntAmount, decimals);
  const amountNumber = Number(amountString);

  if (!Number.isFinite(amountNumber)) return amountString;

  if (amountNumber >= 1000) {
    return Math.round(amountNumber);
  } else {
    return parseFloat(amountNumber.toFixed(4));
  }
};

const theme = createAppTheme('dark');

export const mapStatusToColor = (
  status: Campaign['status'],
  startDate: string,
  endDate: string
) => {
  const now = new Date().toISOString();

  switch (status) {
    case CampaignStatus.ACTIVE:
      if (now < startDate) {
        return theme.palette.warning.main;
      } else if (now > endDate) {
        return theme.palette.error.main;
      } else {
        return theme.palette.success.main;
      }
    case CampaignStatus.CANCELLED:
      return theme.palette.primary.main;
    case CampaignStatus.COMPLETED:
      return theme.palette.secondary.main;
    case CampaignStatus.TO_CANCEL:
      return 'cyan';
    default:
      return theme.palette.primary.main;
  }
};

export const mapTypeToLabel = (type: CampaignType) => {
  switch (type) {
    case 'MARKET_MAKING':
      return 'Market Making';
    case 'HOLDING':
      return 'Holding';
    default:
      return type;
  }
};

export const getDailyTargetTokenSymbol = (
  campaignType: CampaignType,
  symbol: string
) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return symbol.split('/')[1];
    case CampaignType.HOLDING:
      return symbol;
    default:
      return symbol.split('/')[1];
  }
};

export const getChainIcon = (chainId: ChainId) => {
  return CHAIN_ICONS[chainId] || null;
};

export const getNetworkName = (chainId: ChainId): string | null => {
  return NETWORKS[chainId]?.title || null;
};

export const isCampaignDetails = (obj: unknown): obj is CampaignDetails => {
  if (!obj || typeof obj !== 'object') return false;

  const requiredCampaignFields = [
    'id',
    'chain_id',
    'address',
    'exchange_name',
    'symbol',
    'start_date',
    'end_date',
    'final_results_url',
    'fund_amount',
    'fund_token',
    'fund_token_symbol',
    'fund_token_decimals',
    'intermediate_results_url',
    'status',
    'escrow_status',
    'launcher',
    'exchange_oracle',
    'recording_oracle',
    'reputation_oracle',
    'amount_paid',
    'daily_paid_amounts',
    'reserved_funds',
  ];

  for (const field of requiredCampaignFields) {
    if (!(field in obj)) return false;
  }

  return true;
};

type ConstructCampaignDetailsProps = {
  chainId: ChainId;
  address: string;
  data: CampaignFormValues;
  tokenDecimals: number;
  fees: {
    exchangeOracleFee: bigint;
    recordingOracleFee: bigint;
    reputationOracleFee: bigint;
  };
};

export const constructCampaignDetails = ({
  chainId,
  address,
  data,
  tokenDecimals,
  fees,
}: ConstructCampaignDetailsProps) => {
  const fundAmount = ethers.parseUnits(
    data.fund_amount.toString(),
    tokenDecimals
  );

  return {
    id: address,
    chain_id: chainId,
    address: address,
    type: data.type,
    exchange_name: data.exchange,
    ...(data.type === CampaignType.MARKET_MAKING && { symbol: data.pair }),
    ...(data.type === CampaignType.HOLDING && { symbol: data.symbol }),
    details: {
      ...(data.type === CampaignType.MARKET_MAKING && {
        daily_volume_target: data.daily_volume_target,
      }),
      ...(data.type === CampaignType.HOLDING && {
        daily_balance_target: data.daily_balance_target,
      }),
    },
    start_date: data.start_date,
    end_date: data.end_date,
    final_results_url: null,
    fund_amount: fundAmount.toString(),
    fund_token: '',
    fund_token_symbol: data.fund_token.toUpperCase(),
    fund_token_decimals: tokenDecimals,
    intermediate_results_url: null,
    status: 'active',
    escrow_status: 'pending',
    launcher: address,
    reserved_funds: '0',
    exchange_oracle: '',
    exchange_oracle_fee_percent: Number(fees.exchangeOracleFee),
    recording_oracle: '',
    recording_oracle_fee_percent: Number(fees.recordingOracleFee),
    reputation_oracle: '',
    reputation_oracle_fee_percent: Number(fees.reputationOracleFee),
    amount_paid: '0',
    daily_paid_amounts: [],
  };
};

export const calculateHash = async (
  manifest: string,
  algorithm: AlgorithmIdentifier = 'SHA-1'
): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(manifest);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const filterFalsyQueryParams = (
  params: Record<string, string | number | undefined>
): Record<string, string | number> => {
  const result: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      result[key] = value;
    }
  }

  return result;
};

export const getTokenInfo = (token: string) => {
  return (
    TOKENS.find((t) => t.name.toLowerCase() === token.toLowerCase()) || {
      name: token,
      label: token,
      icon: null,
    }
  );
};

export const convertFromSnakeCaseToTitleCase = (str: string) => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
