import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
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

import {
  CampaignDetails,
  CampaignType,
  CampaignJoinStatus,
  ReturnedCampaignStatus,
} from './types';

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

class JoinedCampaignDto {
  @ApiProperty({ name: 'chain_id' })
  chainId: number;

  @ApiProperty()
  address: string;

  @ApiProperty({ name: 'exchange_name' })
  exchangeName: string;

  @ApiProperty()
  symbol: string;

  @ApiProperty({ name: 'start_date' })
  startDate: string;

  @ApiProperty({ name: 'end_date' })
  endDate: string;

  @ApiProperty({ name: 'fund_amount' })
  fundAmount: number;

  @ApiProperty({ name: 'fund_token' })
  fundToken: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ name: 'processing_status' })
  processingStatus: string;

  type: CampaignType;

  details: CampaignDetails;
}

class MarketMakingCampaignDetailsDto {
  @ApiProperty({ name: 'daily_volume_target' })
  dailyVolumeTarget: number;
}

class MarketMakingCampaignDto extends JoinedCampaignDto {
  @ApiProperty({ enum: [CampaignType.MARKET_MAKING] })
  declare type: CampaignType.MARKET_MAKING;

  @ApiProperty()
  declare details: MarketMakingCampaignDetailsDto;
}

class HoldingCampaignDetailsDto {
  @ApiProperty({ name: 'daily_balance_target' })
  dailyBalanceTarget: number;
}

class HoldingCampaignDto extends JoinedCampaignDto {
  @ApiProperty({ enum: [CampaignType.HOLDING] })
  declare type: CampaignType.HOLDING;

  @ApiProperty()
  declare details: HoldingCampaignDetailsDto;
}

class ThresholdCampaignDetailsDto {
  @ApiProperty({ name: 'minimum_balance_target' })
  minimumBalanceTarget: number;
}

class ThresholdCampaignDto extends JoinedCampaignDto {
  @ApiProperty({ enum: [CampaignType.THRESHOLD] })
  declare type: CampaignType.THRESHOLD;

  @ApiProperty()
  declare details: ThresholdCampaignDetailsDto;
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

@ApiExtraModels(
  MarketMakingCampaignDto,
  HoldingCampaignDto,
  ThresholdCampaignDto,
)
export class ListJoinedCampaignsSuccessDto {
  @ApiProperty({
    name: 'has_more',
  })
  hasMore: boolean;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(MarketMakingCampaignDto) },
      { $ref: getSchemaPath(HoldingCampaignDto) },
      { $ref: getSchemaPath(ThresholdCampaignDto) },
    ],
    discriminator: {
      propertyName: 'type',
      mapping: {
        [CampaignType.MARKET_MAKING]: getSchemaPath(MarketMakingCampaignDto),
        [CampaignType.HOLDING]: getSchemaPath(HoldingCampaignDto),
        [CampaignType.THRESHOLD]: getSchemaPath(ThresholdCampaignDto),
      },
    },
    isArray: true,
  })
  results: JoinedCampaignDto[];
}

export class CheckJoinStatusDto {
  @ApiProperty({ name: 'chain_id', enum: ChainIds })
  @IsIn(ChainIds)
  chainId: ChainId;

  @ApiProperty()
  @IsEthereumAddress()
  address: string;
}

export class CheckJoinStatusResponseDto {
  @ApiProperty({
    enum: CampaignJoinStatus,
  })
  status: CampaignJoinStatus;

  @ApiPropertyOptional({ name: 'joined_at' })
  joinedAt?: string;

  @ApiPropertyOptional({ name: 'closed_due' })
  closedDue?: string;
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
  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty({
    name: 'my_score',
  })
  myScore: number;

  @ApiProperty({
    name: 'my_meta',
  })
  myMeta: object;

  @ApiProperty({
    name: 'total_meta',
  })
  totalMeta: object;
}
