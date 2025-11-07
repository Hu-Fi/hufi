import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsEthereumAddress, IsDateString, IsEnum } from 'class-validator';

import { type ChainId, ChainIds } from '@/common/constants';

export class CheckCampaignProgressDto {
  @ApiProperty({ name: 'chain_id', enum: ChainIds })
  @IsIn(ChainIds)
  chainId: ChainId;

  @ApiProperty()
  @IsEthereumAddress()
  address: string;

  @ApiProperty({ name: 'from_date' })
  @IsDateString()
  fromDate: string;

  @ApiProperty({ name: 'to_date' })
  @IsDateString()
  toDate: string;
}

export enum AdminCronJobId {
  REFRESH_INTERIM_CAMPAIGNS_PROGRESS_CACHE = 'refresh_icp_cache',
  CAMPAIGNS_PROGRESS_RECORDING = 'progress_recording',
  DISCOVER_NEW_CAMPAIGNS = 'discover_new_campaigns',
  SYNC_CAMPAIGN_STATUSES = 'sync_campaign_statuses',
}

export class TriggerCronJobDto {
  @ApiProperty({ name: 'job_id', enum: AdminCronJobId })
  @IsEnum(AdminCronJobId)
  jobId: AdminCronJobId;
}

export class TriggerCronJobResponseDto {
  @ApiProperty()
  success: boolean;
}
