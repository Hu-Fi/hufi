import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNumber, IsString } from 'class-validator';

export class CampaignCreateRequestDto {
  @ApiProperty({
    name: 'chain_id',
  })
  @IsNumber()
  public chainId: number;

  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  address: string;
}
