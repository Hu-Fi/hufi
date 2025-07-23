import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEthereumAddress, IsOptional, Validate } from 'class-validator';

import {
  type ChainId,
  ChainIds,
  SUPPORTED_EXCHANGE_NAMES,
} from '@/common/constants';
import { ExchangeNameValidator, IsChainId } from '@/common/validators';

export class GetCampaignsQueryDto {
  @ApiProperty({
    name: 'chain_id',
    enum: ChainIds,
  })
  @IsChainId()
  chainId: ChainId;

  @ApiPropertyOptional({
    name: 'exchange_name',
    enum: SUPPORTED_EXCHANGE_NAMES,
  })
  @IsOptional()
  @Validate(ExchangeNameValidator)
  exchangeName?: string;

  @ApiPropertyOptional({
    description: 'Address of campaign launcher',
  })
  @IsOptional()
  @IsEthereumAddress()
  launcher?: string;
}
