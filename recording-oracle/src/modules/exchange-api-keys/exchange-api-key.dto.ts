import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EnrollExchangeApiKeysDto {
  @ApiProperty({ name: 'api_key' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  apiKey: string;

  @ApiProperty({ name: 'secret_key' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  secretKey: string;
}

class ExchangeNameParamDto {
  @ApiProperty({ name: 'exchange_name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  exchangeName: string;
}
export class EncrollExchangeApiKeysParamsDto extends ExchangeNameParamDto {}

export class EnrollExchangeApiKeysResponseDto {
  @ApiProperty()
  id: string;
}

export class DeleteExchangeApiKeysParamsDto extends ExchangeNameParamDto {}
