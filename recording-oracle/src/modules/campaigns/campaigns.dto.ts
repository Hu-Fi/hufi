import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsEthereumAddress } from 'class-validator';

import { ChainIds, type ChainId } from '@/common/constants';

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

export class ListJoinedCampaignsSuccessDto {
  @ApiProperty()
  campaigns: string[];
}
