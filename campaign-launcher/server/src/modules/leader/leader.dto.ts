import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class LeaderDataDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsEnum(ChainId)
  chainId: ChainId;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  amountStaked: string;

  @ApiProperty()
  @IsString()
  amountAllocated: string;

  @ApiProperty()
  @IsString()
  amountLocked: string;

  @ApiProperty()
  @IsString()
  lockedUntilTimestamp: string;

  @ApiProperty()
  @IsString()
  amountWithdrawn: string;

  @ApiProperty()
  @IsString()
  amountSlashed: string;

  @ApiProperty()
  @IsString()
  reputation: string;

  @ApiProperty()
  @IsString()
  reward: string;

  @ApiProperty()
  @IsString()
  amountJobsLaunched: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fee?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  publicKey?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  jobTypes?: string[];
}
