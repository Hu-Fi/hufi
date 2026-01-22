import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Validate } from 'class-validator';

import { ExchangeName } from '@/common/constants';
import { ExchangeNameValidator } from '@/common/validators';

export class ExchangeQueryDto {
  @ApiPropertyOptional({
    name: 'exchange_name',
    enum: ExchangeName,
  })
  @IsOptional()
  @Validate(ExchangeNameValidator)
  exchangeName?: ExchangeName;
}

export class GetTotalVolumeResponseDto {
  @ApiProperty({ name: 'total_volume' })
  totalVolume: number;
}

export class CampaignsStatsDto {
  @ApiProperty({ name: 'n_finished' })
  nFinished: number;
  @ApiProperty({ name: 'n_completed' })
  nCompleted: number;
  @ApiProperty({ name: 'n_cancelled' })
  nCancelled: number;
}
