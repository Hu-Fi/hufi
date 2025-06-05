import { ApiProperty } from '@nestjs/swagger';
import ccxt from 'ccxt';
import { IsNotEmpty, IsString, MaxLength, Validate } from 'class-validator';

import { ExchangeNameValidator } from '@/common/validators';

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
  @ApiProperty({
    name: 'exchange_name',
    enum: ccxt.exchanges,
  })
  @Validate(ExchangeNameValidator)
  exchangeName: string;
}
export class EncrollExchangeApiKeysParamsDto extends ExchangeNameParamDto {}

export class EnrollExchangeApiKeysResponseDto {
  @ApiProperty()
  id: string;
}

export class DeleteExchangeApiKeysParamsDto extends ExchangeNameParamDto {}
