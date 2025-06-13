import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsEthereumAddress, IsUUID } from 'class-validator';

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
  @IsUUID()
  id: string;
}
