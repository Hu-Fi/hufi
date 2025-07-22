import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, Validate } from 'class-validator';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';
import { ExchangeNameValidator } from '@/common/validators';

import { ExchangeType } from './types';

export class ExchangeDataDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  logo: string;

  @ApiProperty()
  @IsEnum(ExchangeType)
  type: ExchangeType;
}

export class ExchangeNameParamDto {
  @ApiProperty({
    name: 'exchange_name',
    enum: SUPPORTED_EXCHANGE_NAMES,
  })
  @Validate(ExchangeNameValidator)
  exchangeName: string;
}
