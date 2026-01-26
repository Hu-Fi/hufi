import { ApiProperty } from '@nestjs/swagger';
import { Validate } from 'class-validator';

import { ExchangeName, ExchangeType } from '@/common/constants';
import { ExchangeNameValidator } from '@/common/validators';

export class ExchangeDataDto {
  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  name: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  logo: string;

  @ApiProperty({ enum: ExchangeType })
  type: ExchangeType;
}

export class ExchangeNameParamDto {
  @ApiProperty({
    name: 'exchange_name',
    enum: ExchangeName,
  })
  @Validate(ExchangeNameValidator)
  exchangeName: ExchangeName;
}
