import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CampaignDataDto {
  @ApiProperty()
  @IsEnum(ChainId)
  chainId: ChainId;

  @ApiProperty()
  @IsString()
  requesterAddress: string;

  @ApiProperty()
  @IsString()
  exchangeName: string;

  @ApiProperty()
  @IsString()
  symbol: string;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty()
  @IsString()
  fundAmount: string;

  @ApiProperty()
  @IsNumber()
  startBlock: number;

  @ApiProperty()
  @IsNumber()
  endBlock: number;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  amountPaid: string;

  @ApiProperty()
  @IsString()
  balance: string;

  @ApiProperty()
  @IsString()
  count: string;

  @ApiProperty()
  @IsString()
  factoryAddress: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  finalResultsUrl?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  intermediateResultsUrl?: string;

  @ApiProperty()
  @IsString()
  launcher: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  manifestHash?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  manifestUrl?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  recordingOracle?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  recordingOracleFee?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reputationOracle?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reputationOracleFee?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  exchangeOracle?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  exchangeOracleFee?: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  totalFundedAmount: string;

  @ApiProperty()
  @IsString()
  createdAt: string;

  @ApiProperty()
  @IsArray()
  dailyAmountPaid: DailyAmountPaid[];
}

export class DailyAmountPaid {
  @ApiProperty()
  @IsString()
  date: string;

  @ApiProperty()
  @IsNumber()
  totalAmountPaid: string;
}

export class CreateCampaignDto {
  @ApiProperty()
  @IsEnum(ChainId)
  chainId: ChainId;

  @ApiProperty()
  @IsString()
  manifestUrl: string;

  @ApiProperty()
  @IsString()
  manifestHash: string;

  @ApiProperty()
  @IsString()
  tokenAddress: string;

  @ApiProperty()
  @IsString()
  fundAmount: string;
}
