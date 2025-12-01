import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
} from 'class-validator';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';
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
  @MaxLength(5000)
  secretKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  extras?: Record<string, unknown>;
}

export class ExchangeNameParamDto {
  @ApiProperty({
    name: 'exchange_name',
    enum: SUPPORTED_EXCHANGE_NAMES,
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

export class EnrolledApiKeyDto {
  @ApiProperty({ name: 'exchange_name' })
  exchangeName: string;

  @ApiProperty({ name: 'api_key' })
  apiKey: string;
}
