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
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import type { Constructor } from 'type-fest';

import { ExchangeName, ExchangeType } from '@/common/constants';
import { ExchangeNameValidator } from '@/common/validators';

export class ExchangeNameParamDto {
  @ApiProperty({
    name: 'exchange_name',
    enum: ExchangeName,
  })
  @Validate(ExchangeNameValidator, [ExchangeType.CEX], {
    message: 'exchangeName must be supported CEX name',
  })
  exchangeName: ExchangeName;
}

export class KucoinExtras {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(32)
  @Matches(/^\S*$/, { message: 'passphrase should not contain spaces' })
  passphrase: string;
}

@ApiExtraModels(KucoinExtras)
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
    oneOf: [{ $ref: getSchemaPath(KucoinExtras) }],
  })
  @ValidateIf((o: EnrollExchangeApiKeysDto) =>
    [ExchangeName.KUCOIN].includes(o.exchangeName),
  )
  @ValidateNested()
  @Transform((params: { obj: EnrollExchangeApiKeysDto; value: unknown }) => {
    let exchangeExtrasDtoClass: Constructor<KucoinExtras> | undefined;

    switch (params.obj.exchangeName) {
      case ExchangeName.KUCOIN: {
        exchangeExtrasDtoClass = KucoinExtras;
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
  extras?: KucoinExtras;
}

export class EnrollExchangeApiKeysResponseDto {
  @ApiProperty()
  id: string;
}

@ApiExtraModels(KucoinExtras)
export class EnrolledApiKeyDto {
  @ApiProperty({ name: 'exchange_name' })
  exchangeName: string;

  @ApiProperty({ name: 'api_key' })
  apiKey: string;

  @ApiPropertyOptional({
    oneOf: [{ $ref: getSchemaPath(KucoinExtras) }],
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
