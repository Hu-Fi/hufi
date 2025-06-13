import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseFilters,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import type { RequestWithUser } from '@/common/types';

import {
  JoinCampaignDto,
  JoinCampaignSuccessDto,
  ListJoinedCampaignsSuccessDto,
} from './campaigns.dto';
import { CampaignsControllerErrorsFilter } from './campaigns.error-filter';
import { CampaignsService } from './campaigns.service';

@ApiTags('Campaign')
@Controller('/campaign')
@UseFilters(CampaignsControllerErrorsFilter)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @ApiBearerAuth()
  @Post('/join')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Join campaign.',
    description: 'Endpoint for joining the campaign.',
  })
  @ApiBody({ type: JoinCampaignDto })
  @ApiResponse({
    status: 200,
    description: 'User joined successfully',
    type: JoinCampaignSuccessDto,
  })
  async joinCampaign(
    @Req() request: RequestWithUser,
    @Body() data: JoinCampaignDto,
  ): Promise<JoinCampaignSuccessDto> {
    const campaignId = await this.campaignsService.join(
      request.user.id,
      data.chainId,
      data.address,
    );
    return { id: campaignId };
  }

  @ApiBearerAuth()
  @Get('/')
  @HttpCode(200)
  @ApiOperation({
    summary: 'List joined campaigns.',
    description: 'Retrieve the list of campaign addresses user joined.',
  })
  @ApiResponse({
    status: 200,
    description: 'List retrieved successfully',
    type: ListJoinedCampaignsSuccessDto,
  })
  async joinedCampaigns(
    @Req() request: RequestWithUser,
  ): Promise<ListJoinedCampaignsSuccessDto> {
    const campaigns = await this.campaignsService.getJoined(request.user.id);
    return { campaigns };
  }
}
