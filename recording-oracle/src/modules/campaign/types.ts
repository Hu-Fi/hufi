import { Type } from 'class-transformer';
import { IsDateString, IsString, Validate } from 'class-validator';

import {
  CampaignDurationValidator,
  ExchangeNameValidator,
} from '@/common/validators';

/*
    Internal status of the campaign in recording oracle database.
    Used to simplify queries for results calculation and cancellation.
*/
export enum CampaignStatus {
  ACTIVE = 'active',
  PENDING_CANCELLATION = 'pending_cancellation',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export class CampaignManifest {
  @Validate(ExchangeNameValidator)
  exchange: string;

  @IsString()
  pair: string;

  @IsString()
  fund_token: string;

  @IsDateString()
  @Type(() => Date)
  start_date: Date;

  @IsDateString()
  @Type(() => Date)
  @Validate(CampaignDurationValidator)
  end_date: Date;
}
