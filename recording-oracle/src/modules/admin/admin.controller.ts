import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '@/common/decorators';

import { CheckCampaignProgressDto } from './admin.dto';
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
  constructor(private readonly adminService: AdminService) {}

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
}
