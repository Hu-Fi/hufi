import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEthereumAddress,
  IsNumber,
  IsString,
} from 'class-validator';

export class CampaignRegisterRequestDto {
  @ApiProperty({
    name: 'wallet_address',
    description: 'Address of the wallet',
  })
  @IsString()
  @IsEthereumAddress()
  public walletAddress: string;

  @ApiProperty({
    name: 'chain_id',
    description: 'Chain ID of the campaign',
  })
  @IsNumber()
  public chainId: number;

  @ApiProperty({
    name: 'address',
    description: 'Address of the campaign',
  })
  @IsString()
  @IsEthereumAddress()
  public address: string;

  @ApiProperty({
    name: 'exchange_name',
    description: 'Name of the exchange',
  })
  @IsString()
  public exchangeName: string;

  @ApiProperty({
    name: 'api_key',
    description: 'Read-only API key for the exchange',
  })
  @IsString()
  public apiKey: string;

  @ApiProperty({
    name: 'secret',
    description: 'Read-only API secret for the exchange',
  })
  @IsString()
  public secret: string;
}

export class CampaignRegisterResponseDto {
  @ApiProperty({
    name: 'success',
    description: 'Whether the registration was successful',
  })
  @IsBoolean()
  public success: boolean;
}
