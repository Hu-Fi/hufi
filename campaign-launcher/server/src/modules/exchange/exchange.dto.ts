import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

import { ExchangeType } from '../../common/types/exchange';

export class ExchangeDataDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsString()
  logo: string;

  @ApiProperty()
  @IsEnum(ExchangeType)
  type: ExchangeType;
}
