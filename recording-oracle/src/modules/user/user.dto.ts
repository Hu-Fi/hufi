import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';

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
  @ApiProperty()
  @IsString()
  public exchangeName: string;

  @ApiProperty()
  @IsString()
  public apiKey: string;

  @ApiProperty()
  @IsString()
  public secret: string;
}
