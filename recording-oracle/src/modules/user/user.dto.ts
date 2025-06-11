import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEthereumAddress,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SignatureBodyDto {
  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public from: string;

  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public to: string;

  @ApiProperty()
  @IsString()
  public contents: string;

  @ApiProperty()
  @IsString()
  public nonce: string | undefined;
}

export class ExchangeAPIKeyCreateRequestDto {
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

export class CampaignRegisterRequestDto {
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
}

export class CampaignRegisterResponseDto {
  @ApiProperty({
    name: 'success',
    description: 'Whether the registration was successful',
  })
  @IsBoolean()
  public success: boolean;
}

export class JoinedCampaignDto {
  @ApiProperty({ description: 'ID of the campaign' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Chain ID of the campaign' })
  @IsNumber()
  chainId: ChainId;

  @ApiProperty({ description: 'Address of the campaign' })
  @IsString()
  @IsEthereumAddress()
  address: string;

  @ApiProperty({
    description: 'Name of the exchange',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  exchangeName: string | null;

  @ApiProperty({
    description: 'Token used in the campaign',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  token: string | null;

  @ApiProperty({
    description: 'Symbol of the token used in the campaign',
    required: true,
    type: String,
    example: 'HMT',
  })
  @IsString()
  tokenSymbol: string;

  @ApiProperty({
    description: 'Decimals of the token used in the campaign',
    required: true,
    type: Number,
    example: 18,
  })
  @IsNumber()
  tokenDecimals: number;

  @ApiProperty({
    description: 'Start date of the campaign',
    required: false,
    nullable: true,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  startDate: Date | null;

  @ApiProperty({
    description: 'End date of the campaign',
    required: false,
    nullable: true,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  endDate: Date | null;

  @ApiProperty({
    description: 'Fund token of the campaign',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  fundToken: string | null;

  @ApiProperty({
    description: 'Fund amount of the campaign',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  fundAmount: string | null;

  @ApiProperty({
    description: 'Last synced timestamp',
    type: String,
    format: 'date-time',
  })
  @IsString()
  lastSyncedAt: Date;
}
