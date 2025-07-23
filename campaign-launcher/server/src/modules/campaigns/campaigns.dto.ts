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

export class CampaignData {
  @ApiProperty({
    name: 'chain_id',
  })
  chainId: number;

  @ApiProperty()
  address: string;

  @ApiProperty({
    name: 'exchange_name',
  })
  exchangeName: string;

  @ApiProperty({
    name: 'trading_pair',
  })
  tradingPair: string;

  @ApiProperty({
    name: 'start_date',
  })
  startDate: string;

  @ApiProperty({
    name: 'end_date',
  })
  endDate: string;

  @ApiProperty({
    name: 'fund_amount',
  })
  fundAmount: string;

  @ApiProperty({
    name: 'fund_token',
  })
  fundToken: string;

  @ApiProperty({
    name: 'fund_token_symbol',
  })
  fundTokenSymbol: string;

  @ApiProperty({
    name: 'fund_token_decimals',
  })
  fundTokenDecimals: number;

  @ApiProperty()
  status: string;
}
