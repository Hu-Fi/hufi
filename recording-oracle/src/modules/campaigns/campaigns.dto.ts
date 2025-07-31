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

import { CampaignStatus } from './types';

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

class JoinedCampaignDto {
  @ApiProperty({ name: 'chain_id' })
  chainId: number;

  @ApiProperty()
  address: string;

  @ApiProperty()
  status: string;

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

const VALID_CAMPAIGN_FILTER_STATUSES = [
  CampaignStatus.ACTIVE,
  CampaignStatus.COMPLETED,
];

export class ListJoinedCampaignsQueryDto {
  @ApiPropertyOptional({
    enum: VALID_CAMPAIGN_FILTER_STATUSES,
  })
  @IsOptional()
  @IsIn(VALID_CAMPAIGN_FILTER_STATUSES)
  status?: CampaignStatus;

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
  campaigns: JoinedCampaignDto[];
}
