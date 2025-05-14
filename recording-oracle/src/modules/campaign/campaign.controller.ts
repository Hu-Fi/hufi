import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CampaignEntity } from '../../database/entities';

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

  @Get('/active')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'List active campaigns',
    description:
      'Returns every campaign whose on-chain escrow status is **Pending** or **Partial** and whose endDate is in the future.',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of active campaigns',
    type: CampaignEntity,
    isArray: true,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getActiveCampaigns(): Promise<CampaignEntity[]> {
    return await this.campaignService.getAllActiveCampaigns();
  }
}
