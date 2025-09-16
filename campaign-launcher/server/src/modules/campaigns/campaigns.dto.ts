import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Validate,
} from 'class-validator';

import {
  type ChainId,
  ChainIds,
  DEFAULT_PAGINATION_LIMIT,
  type ReadableEscrowStatus,
} from '@/common/constants';
import { EvmAddressValidator, IsChainId } from '@/common/validators';

import { CampaignStatus } from './types';

export class GetCampaignsQueryDto {
  @ApiProperty({
    name: 'chain_id',
    enum: ChainIds,
  })
  @IsChainId()
  chainId: ChainId;

  @ApiPropertyOptional({
    description: 'Address of campaign launcher',
  })
  @IsOptional()
  @Validate(EvmAddressValidator)
  launcher?: string;

  @ApiPropertyOptional({
    description: 'Status of campaign escrow',
    enum: CampaignStatus,
  })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({
    default: DEFAULT_PAGINATION_LIMIT,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  /**
   * To correspond to 'skip' max value
   */
  @Max(1000)
  limit: number = DEFAULT_PAGINATION_LIMIT;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  /**
   * Subgraph implicit limit should be 5k, but 1k should be enough,
   * since we are not going to provide a full history.
   */
  @Max(1000)
  skip?: number;
}

export class CampaignData {
  @ApiProperty({
    name: 'chain_id',
  })
  chainId: number;

  @ApiProperty()
  address: string;

  @ApiProperty({
    name: 'exchange_name',
  })
  exchangeName: string;

  @ApiProperty({
    name: 'trading_pair',
  })
  tradingPair: string;

  @ApiProperty({
    name: 'daily_volume_target',
  })
  dailyVolumeTarget: number;

  @ApiProperty({
    name: 'start_date',
  })
  startDate: string;

  @ApiProperty({
    name: 'end_date',
  })
  endDate: string;

  @ApiProperty({
    name: 'fund_amount',
  })
  fundAmount: string;

  @ApiProperty({
    name: 'fund_token',
  })
  fundToken: string;

  @ApiProperty({
    name: 'fund_token_symbol',
  })
  fundTokenSymbol: string;

  @ApiProperty({
    name: 'fund_token_decimals',
  })
  fundTokenDecimals: number;

  @ApiProperty()
  status: CampaignStatus;

  @ApiProperty({ name: 'escrow_status' })
  escrowStatus: ReadableEscrowStatus;

  @ApiProperty()
  launcher: string;

  @ApiProperty({ name: 'exchange_oracle' })
  exchangeOracle: string;

  @ApiProperty({ name: 'recording_oracle' })
  recordingOracle: string;

  @ApiProperty({ name: 'reputation_oracle' })
  reputationOracle: string;

  @ApiProperty()
  balance: string;

  @ApiProperty({ name: 'intermediate_results_url' })
  intermediateResultsUrl?: string;

  @ApiProperty({ name: 'final_results_url' })
  finalResultsUrl?: string;
}

export class GetCampaignsResponseDto {
  @ApiProperty({ name: 'has_more' })
  hasMore: boolean;

  @ApiProperty({
    type: CampaignData,
    isArray: true,
  })
  results: CampaignData[];
}

export class GetCampaignWithDetailsParamsDto {
  @ApiProperty({
    name: 'chain_id',
    enum: ChainIds,
  })
  @IsChainId()
  chainId: ChainId;

  @ApiProperty({
    name: 'campaign_address',
  })
  @Validate(EvmAddressValidator)
  campaignAddress: string;
}

class DailyPaidAmount {
  @ApiProperty({
    example: '2025-01-01',
  })
  date: string;
  @ApiProperty()
  amount: string;
}

export class CampaignDataWithDetails extends CampaignData {
  @ApiProperty({
    name: 'amount_paid',
  })
  amountPaid: string;

  @ApiProperty({
    name: 'daily_paid_amounts',
    type: DailyPaidAmount,
    isArray: true,
  })
  dailyPaidAmounts: DailyPaidAmount[];

  @ApiProperty({ name: 'exchange_oracle_fee_percent' })
  exchangeOracleFeePercent: number;

  @ApiProperty({ name: 'recording_oracle_fee_percent' })
  recordingOracleFeePercent: number;

  @ApiProperty({ name: 'reputation_oracle_fee_percent' })
  reputationOracleFeePercent: number;
}
