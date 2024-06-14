import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNumber, IsString } from 'class-validator';

export class LiquidityScoreCalculateRequestDto {
  @ApiProperty({
    name: 'chain_id',
    description: 'Chain ID of the campaign',
  })
  @IsNumber()
  chainId: number;

  @ApiProperty({
    name: 'address',
    description: 'Address of the campaign',
  })
  @IsString()
  @IsEthereumAddress()
  address: string;
}
