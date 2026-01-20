import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  MaxLength,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import {
  SUPPORTED_EXCHANGE_NAMES,
  type SupportedExchange,
} from '@/common/constants';
import { ClassConstructor } from '@/common/types';
import { ExchangeNameValidator } from '@/common/validators';

export class ExchangeNameParamDto {
  @ApiProperty({
    name: 'exchange_name',
    enum: SUPPORTED_EXCHANGE_NAMES,
  })
  @Validate(ExchangeNameValidator)
  exchangeName: SupportedExchange;
}

export class BitmartExtras {
  @ApiProperty({ name: 'api_key_memo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  apiKeyMemo: string;
}

@ApiExtraModels(BitmartExtras)
export class EnrollExchangeApiKeysDto extends ExchangeNameParamDto {
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

  @ApiPropertyOptional({
    description: 'Exchange-specific extras',
    oneOf: [{ $ref: getSchemaPath(BitmartExtras) }],
  })
  @ValidateIf((o: EnrollExchangeApiKeysDto) =>
    ['bitmart'].includes(o.exchangeName),
  )
  @ValidateNested()
  @Transform((params: { obj: EnrollExchangeApiKeysDto; value: unknown }) => {
    let exchangeExtrasDtoClass: ClassConstructor<BitmartExtras> | undefined;

    switch (params.obj.exchangeName) {
      case 'bitmart': {
        exchangeExtrasDtoClass = BitmartExtras;
        break;
      }
    }

    if (exchangeExtrasDtoClass) {
      return plainToInstance(exchangeExtrasDtoClass, params.value || {});
    }
  })
  /**
   * Transform decorator is not called if property doesn't exist in input (request body),
   * so add basic check that the extras object is provided to fail-early
   */
  @IsObject()
  extras?: BitmartExtras;
}

export class EnrollExchangeApiKeysResponseDto {
  @ApiProperty()
  id: string;
}

@ApiExtraModels(BitmartExtras)
export class EnrolledApiKeyDto {
  @ApiProperty({ name: 'exchange_name' })
  exchangeName: string;

  @ApiProperty({ name: 'api_key' })
  apiKey: string;

  @ApiPropertyOptional({
    oneOf: [{ $ref: getSchemaPath(BitmartExtras) }],
  })
  extras?: object;

  @ApiProperty({ name: 'is_valid' })
  isValid: boolean;

  @ApiProperty({ name: 'missing_permissions' })
  missingPermissions: string[];
}

export class RevalidateApiKeyResponseDto {
  @ApiProperty({ name: 'is_valid' })
  isValid: boolean;

  @ApiPropertyOptional({ name: 'missing_permissions' })
  missingPermissions?: string[];
}
