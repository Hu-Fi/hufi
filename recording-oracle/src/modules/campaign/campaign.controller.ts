import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ApiKeyGuard } from '../../common/guards/api-key.guard';

import { CampaignCreateRequestDto } from './campaign.dto';
import { CampaignService } from './campaign.service';

@ApiTags('Campaign')
@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('/')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Create a new campaign',
    description: 'Creates a new campaign',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
  })
  @ApiBody({
    type: CampaignCreateRequestDto,
    description: 'Chain ID, and address of the campaign.',
  })
  @ApiResponse({
    status: 201,
    description: 'Created a new campaign record',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createCampaign(@Body() body: CampaignCreateRequestDto) {
    return await this.campaignService.createCampaign(body);
  }
}
