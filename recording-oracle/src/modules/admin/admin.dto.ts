import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsEthereumAddress, IsDateString } from 'class-validator';

import { type ChainId, ChainIds } from '@/common/constants';

export class CheckCampaignProgressDto {
  @ApiProperty({ name: 'chain_id', enum: ChainIds })
  @IsIn(ChainIds)
  chainId: ChainId;

  @ApiProperty()
  @IsEthereumAddress()
  address: string;

  @ApiProperty({ name: 'from_date' })
  @IsDateString()
  fromDate: string;

  @ApiProperty({ name: 'to_date' })
  @IsDateString()
  toDate: string;
}
