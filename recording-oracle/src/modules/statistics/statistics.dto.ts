import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Validate } from 'class-validator';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';
import { ExchangeNameValidator } from '@/common/validators';

export class GetTotalVolumeQueryDto {
  @ApiPropertyOptional({
    name: 'exchange_name',
    enum: SUPPORTED_EXCHANGE_NAMES,
  })
  @IsOptional()
  @Validate(ExchangeNameValidator)
  exchangeName?: string;
}

export class GetTotalVolumeResponseDto {
  @ApiProperty()
  totalVolume: number;
}
