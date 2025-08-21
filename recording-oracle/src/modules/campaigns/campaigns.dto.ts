import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsEthereumAddress,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

import {
  ChainIds,
  DEFAULT_PAGINATION_LIMIT,
  type ChainId,
} from '@/common/constants';

import { ReturnedCampaignStatus } from './types';

export class JoinCampaignDto {
  @ApiProperty({ name: 'chain_id', enum: ChainIds })
  @IsIn(ChainIds)
  chainId: ChainId;

  @ApiProperty()
  @IsEthereumAddress()
  address: string;
}

export class JoinCampaignSuccessDto {
  @ApiProperty()
  id: string;
}

export class JoinedCampaignDto {
  @ApiProperty({ name: 'chain_id' })
  chainId: number;

  @ApiProperty()
  address: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ name: 'processing_status' })
  processingStatus: string;

  @ApiProperty({ name: 'exchange_name' })
  exchangeName: string;

  @ApiProperty({ name: 'trading_pair' })
  tradingPair: string;

  @ApiProperty({ name: 'daily_volume_target '})
  dailyVolumeTarget: number;

  @ApiProperty({ name: 'start_date' })
  startDate: string;

  @ApiProperty({ name: 'end_date' })
  endDate: string;

  @ApiProperty({ name: 'fund_amount' })
  fundAmount: number;

  @ApiProperty({ name: 'fund_token' })
  fundToken: string;
}

export class ListJoinedCampaignsQueryDto {
  @ApiPropertyOptional({
    enum: ReturnedCampaignStatus,
  })
  @IsOptional()
  @IsEnum(ReturnedCampaignStatus)
  status?: ReturnedCampaignStatus;

  @ApiPropertyOptional({
    default: DEFAULT_PAGINATION_LIMIT,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  limit: number = DEFAULT_PAGINATION_LIMIT;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  skip?: number;
}

export class ListJoinedCampaignsSuccessDto {
  @ApiProperty({
    name: 'has_more',
  })
  hasMore: boolean;

  @ApiProperty({
    type: JoinedCampaignDto,
    isArray: true,
  })
  results: JoinedCampaignDto[];
}

export class CheckUserJoinedDto {
  @ApiProperty({ name: 'chain_id', enum: ChainIds })
  @IsIn(ChainIds)
  chainId: ChainId;

  @ApiProperty()
  @IsEthereumAddress()
  address: string;
}

export class CheckUserJoinedResponseDto {
  @ApiProperty({
    name: 'is_joined',
  })
  isJoined: boolean;
}

export class CampaignParamsDto {
  @ApiProperty({
    name: 'chain_id',
    enum: ChainIds,
  })
  @Transform(({ value }) => Number(value))
  @IsIn(ChainIds)
  chainId: ChainId;

  @ApiProperty({
    name: 'campaign_address',
  })
  @IsEthereumAddress()
  campaignAddress: string;
}

export class GetUserProgressResponseDto {
  @ApiProperty({
    name: 'total_score',
  })
  totalScore: number;

  @ApiProperty({
    name: 'total_volume',
  })
  totalVolume: number;
}
