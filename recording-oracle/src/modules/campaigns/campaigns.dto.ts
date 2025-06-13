import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsEthereumAddress } from 'class-validator';

import { ChainIds, type ChainId } from '@/utils/chain';

export class JoinCampaignDto {
  @ApiProperty({ name: 'chain_id', enum: ChainIds })
  @IsEnum(ChainIds)
  @Transform(({ value }) => Number(value))
  chainId: ChainId;

  @ApiProperty()
  @IsEthereumAddress()
  address: string;
}

export class JoinCampaignSuccessDto {
  @ApiProperty()
  id: string;
}

export class ListJoinedCampaignsSuccessDto {
  @ApiProperty()
  campaigns: string[];
}
