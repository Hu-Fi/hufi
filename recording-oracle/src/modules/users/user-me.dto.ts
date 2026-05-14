import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';

import { CampaignType, ExchangeName } from '@/common/constants';

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

  @ApiProperty({ name: 'campaign_types', enum: CampaignType, isArray: true })
  @IsArray()
  @ArrayMaxSize(Object.values(CampaignType).length)
  @IsEnum(CampaignType, { each: true })
  @ArrayUnique()
  campaignTypes: string[];

  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(MAX_CAMPAIGNS_AUTOJOIN_TOKENS)
  @IsString({ each: true })
  @Length(3, 10, { each: true })
  @Matches(/^[A-Z0-9]+$/, { each: true })
  @ArrayUnique()
  tokens: string[];
}

export class PreferencesDto {
  @ApiProperty({
    name: 'campaigns_autojoin',
  })
  @ValidateNested()
  @Type(() => CampaignsAutojoinPreferencesDto)
  campaignsAutojoin: CampaignsAutojoinPreferencesDto;
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
