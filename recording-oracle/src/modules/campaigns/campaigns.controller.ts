import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
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
  ListJoinedCampaignsQueryDto,
  ListJoinedCampaignsSuccessDto,
} from './campaigns.dto';
import { CampaignsControllerErrorsFilter } from './campaigns.error-filter';
import { CampaignsService } from './campaigns.service';
import { ReturnedCampaignStatus, CampaignStatus } from './types';

const RETURNED_STATUS_TO_CAMPAIGN_STATUSES: Record<
  ReturnedCampaignStatus,
  CampaignStatus[]
> = {
  [CampaignStatus.ACTIVE]: [
    CampaignStatus.ACTIVE,
    CampaignStatus.PENDING_CANCELLATION,
    CampaignStatus.PENDING_COMPLETION,
  ],
  [CampaignStatus.CANCELLED]: [CampaignStatus.CANCELLED],
  [CampaignStatus.COMPLETED]: [CampaignStatus.COMPLETED],
};

const CAMPAIGN_STATUS_TO_RETURNED_STATUS: Record<
  string,
  ReturnedCampaignStatus
> = {};
for (const [returnedCampaignStatus, campaignStatuses] of Object.entries(
  RETURNED_STATUS_TO_CAMPAIGN_STATUSES,
)) {
  for (const campaignStatus of campaignStatuses) {
    CAMPAIGN_STATUS_TO_RETURNED_STATUS[campaignStatus] =
      returnedCampaignStatus as ReturnedCampaignStatus;
  }
}

@ApiTags('Campaigns')
@Controller('/campaigns')
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
    @Query() query: ListJoinedCampaignsQueryDto,
  ): Promise<ListJoinedCampaignsSuccessDto> {
    const limit = query.limit;

    const statuses: CampaignStatus[] = query.status
      ? RETURNED_STATUS_TO_CAMPAIGN_STATUSES[query.status]
      : [];

    const campaigns = await this.campaignsService.getJoined(request.user.id, {
      statuses,
      limit: limit + 1,
      skip: query.skip,
    });

    return {
      hasMore: campaigns.length > limit,
      campaigns: campaigns
        .map((campaign) => ({
          chainId: campaign.chainId,
          address: campaign.address,
          status: CAMPAIGN_STATUS_TO_RETURNED_STATUS[campaign.status],
          processingStatus: campaign.status,
          exchangeName: campaign.exchangeName,
          tradingPair: campaign.pair,
          startDate: campaign.startDate.toISOString(),
          endDate: campaign.endDate.toISOString(),
          fundAmount: Number(campaign.fundAmount),
          fundToken: campaign.fundToken,
        }))
        .slice(0, limit),
    };
  }
}
