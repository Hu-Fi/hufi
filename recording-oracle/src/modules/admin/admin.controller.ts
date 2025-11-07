import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '@/common/decorators';
import dayjs from '@/common/utils/dayjs';
import Environment from '@/common/utils/environment';
import { CampaignsService } from '@/modules/campaigns';

import {
  AdminCronJobId,
  CheckCampaignProgressDto,
  TriggerCronJobDto,
  TriggerCronJobResponseDto,
} from './admin.dto';
import { AdminControllerErrorsFilter } from './admin.error-filter';
import { AdminService } from './admin.service';
import { ADMIN_API_KEY_HEADER, AdminApiKeyAuthGuard } from './api-key.guard';

@ApiTags('Admin')
@Controller('/admin')
@Public()
@ApiHeader({
  name: ADMIN_API_KEY_HEADER,
  description: 'Admin API key',
  required: true,
})
@UseGuards(AdminApiKeyAuthGuard)
@UseFilters(AdminControllerErrorsFilter)
export class AdminController {
  private cronJobTriggerTimes: Map<AdminCronJobId, number> = new Map();

  constructor(
    private readonly adminService: AdminService,
    private readonly campaignsService: CampaignsService,
  ) {}

  @ApiOperation({
    summary: 'Check progress for campaign',
  })
  @ApiResponse({
    status: 200,
    description: 'Intermediate results for the specified period',
  })
  @HttpCode(200)
  @Post('/check-campaign-progress')
  async checkCampaignProgress(@Body() input: CheckCampaignProgressDto) {
    if (input.fromDate >= input.toDate) {
      throw new BadRequestException('Invalid dates range provided');
    }

    const result = await this.adminService.checkCampaignProgress(input);

    return { result };
  }

  private assertCronJobTriggerAvailable(cronJobId: AdminCronJobId): void {
    if (Environment.isProduction()) {
      throw new ForbiddenException('Not available in production');
    }

    const lastTriggerTimestamp = this.cronJobTriggerTimes.get(cronJobId) || 0;
    if (dayjs().diff(lastTriggerTimestamp, 'minute') >= 1) {
      this.cronJobTriggerTimes.set(cronJobId, Date.now());
      return;
    }

    throw new HttpException(
      {
        message: 'Too early',
        lastTriggeredAt: new Date(lastTriggerTimestamp),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  @ApiOperation({
    summary: 'Manually trigger run of some cron job',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully triggered',
    type: TriggerCronJobResponseDto,
  })
  @HttpCode(200)
  @Post('/trigger-cron-job')
  async triggerCronJob(
    @Body() { jobId }: TriggerCronJobDto,
  ): Promise<TriggerCronJobResponseDto> {
    this.assertCronJobTriggerAvailable(jobId);

    switch (jobId) {
      case AdminCronJobId.SYNC_CAMPAIGN_STATUSES:
        void this.campaignsService.syncCampaignStatuses();
        break;
      case AdminCronJobId.DISCOVER_NEW_CAMPAIGNS:
        void this.campaignsService.discoverNewCampaigns();
        break;
      case AdminCronJobId.CAMPAIGNS_PROGRESS_RECORDING:
        void this.campaignsService.recordCampaignsProgress();
        break;
      case AdminCronJobId.REFRESH_INTERIM_CAMPAIGNS_PROGRESS_CACHE:
        void this.campaignsService.refreshInterimProgressCache();
        break;
      default:
        throw new BadRequestException(`Unknown cron job id: ${jobId}`);
    }

    return { success: true };
  }
}
