import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsEthereumAddress,
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
  @IsEnum(ChainIds)
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
