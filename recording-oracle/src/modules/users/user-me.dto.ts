import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import {
  ALLOWED_AUTOJOIN_CAMPAIGN_TYPES,
  ExchangeName,
} from '@/common/constants';

import { MAX_CAMPAIGNS_AUTOJOIN_TOKENS } from './constants';

export class CampaignsAutojoinPreferencesDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ enum: ExchangeName, isArray: true })
  @IsArray()
  @ArrayMaxSize(Object.values(ExchangeName).length)
  @IsEnum(ExchangeName, { each: true })
  @ArrayUnique()
  exchanges: string[];

  @ApiProperty({
    name: 'campaign_types',
    enum: ALLOWED_AUTOJOIN_CAMPAIGN_TYPES,
    isArray: true,
  })
  @IsArray()
  @ArrayMaxSize(ALLOWED_AUTOJOIN_CAMPAIGN_TYPES.length)
  @IsIn(ALLOWED_AUTOJOIN_CAMPAIGN_TYPES, { each: true })
  @ArrayUnique()
  campaignTypes: string[];

  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(MAX_CAMPAIGNS_AUTOJOIN_TOKENS)
  @IsString({ each: true })
  @Matches(/^[A-Z0-9]{3,10}$/, { each: true })
  @ArrayUnique()
  tokens: string[];
}

export class NotificationsPreferencesDto {
  @ApiProperty({ name: 'telegram_user_id' })
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MinLength(1)
  telegramUserId: string | null;

  @ApiProperty({ name: 'campaigns_autojoin' })
  @IsBoolean()
  campaignsAutojoin: boolean;
}

export class PreferencesDto {
  @ApiProperty({
    name: 'campaigns_autojoin',
  })
  @ValidateNested()
  @Type(() => CampaignsAutojoinPreferencesDto)
  campaignsAutojoin: CampaignsAutojoinPreferencesDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => NotificationsPreferencesDto)
  notifications: NotificationsPreferencesDto;
}

export class UpdatePreferencesDto extends PartialType(PreferencesDto) {}

export class UserMeDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ name: 'evm_address' })
  evmAddress: string;

  @ApiProperty()
  preferences: PreferencesDto;
}
