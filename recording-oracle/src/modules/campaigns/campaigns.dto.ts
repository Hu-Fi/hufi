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

class JoinedCampaignDto {
  @ApiProperty({ name: 'chain_id' })
  chainId: number;
  @ApiProperty()
  address: string;
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

export class ListJoinedCampaignsSuccessDto {
  @ApiProperty({
    type: JoinedCampaignDto,
    isArray: true,
  })
  campaigns: JoinedCampaignDto[];
}
