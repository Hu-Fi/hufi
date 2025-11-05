import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
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
  CampaignParamsDto,
  CheckUserJoinedDto,
  CheckUserJoinedResponseDto,
  GetUserProgressResponseDto,
  JoinCampaignDto,
  JoinCampaignSuccessDto,
  ListJoinedCampaignsQueryDto,
  ListJoinedCampaignsSuccessDto,
} from './campaigns.dto';
import { CampaignsControllerErrorsFilter } from './campaigns.error-filter';
import { CampaignNotFoundError } from './campaigns.errors';
import { CampaignsService } from './campaigns.service';
import { ReturnedCampaignStatus, CampaignStatus } from './types';

const RETURNED_STATUS_TO_CAMPAIGN_STATUSES: Record<
  ReturnedCampaignStatus,
  CampaignStatus[]
> = {
  [CampaignStatus.ACTIVE]: [
    CampaignStatus.ACTIVE,
    CampaignStatus.PENDING_COMPLETION,
  ],
  [CampaignStatus.TO_CANCEL]: [
    CampaignStatus.TO_CANCEL,
    CampaignStatus.PENDING_CANCELLATION,
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
@ApiBearerAuth()
@UseFilters(CampaignsControllerErrorsFilter)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @ApiOperation({
    summary: 'List joined campaigns.',
    description: 'Retrieve the list of campaign addresses user joined.',
  })
  @ApiResponse({
    status: 200,
    description: 'List retrieved successfully',
    type: ListJoinedCampaignsSuccessDto,
  })
  @HttpCode(200)
  @Get('/')
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
      results: campaigns
        .map((campaign) => ({
          chainId: campaign.chainId,
          address: campaign.address,
          type: campaign.type,
          exchangeName: campaign.exchangeName,
          symbol: campaign.symbol,
          startDate: campaign.startDate.toISOString(),
          endDate: campaign.endDate.toISOString(),
          fundAmount: Number(campaign.fundAmount),
          fundToken: campaign.fundToken,
          details: campaign.details,
          status: CAMPAIGN_STATUS_TO_RETURNED_STATUS[campaign.status],
          processingStatus: campaign.status,
        }))
        .slice(0, limit),
    };
  }

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
  @HttpCode(200)
  @Post('/join')
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

  @ApiOperation({
    summary: 'Check if user has joined the campaign',
  })
  @ApiResponse({
    status: 200,
    description: 'Result indicating if user joined the provided campaign',
    type: CheckUserJoinedResponseDto,
  })
  @ApiBody({ type: CheckUserJoinedDto })
  @HttpCode(200)
  @Post('/check-is-joined')
  async checkIsJoined(
    @Req() request: RequestWithUser,
    @Body() data: CheckUserJoinedDto,
  ): Promise<CheckUserJoinedResponseDto> {
    const isUserJoined = await this.campaignsService.checkUserJoined(
      request.user.id,
      data.chainId,
      data.address,
    );

    return {
      isJoined: isUserJoined,
    };
  }

  @ApiOperation({
    summary: 'Check user progress for the campaign',
  })
  @ApiResponse({
    status: 200,
    description: 'Details about user progress',
    type: GetUserProgressResponseDto,
  })
  @Header('Cache-Control', 'private, max-age=30')
  @HttpCode(200)
  @Get('/:chain_id-:campaign_address/my-progress')
  async getUserProgress(
    @Req() request: RequestWithUser,
    @Param() { chainId, campaignAddress }: CampaignParamsDto,
  ): Promise<GetUserProgressResponseDto> {
    try {
      const userProgress = await this.campaignsService.getUserProgress(
        request.user.id,
        request.user.evmAddress,
        chainId,
        campaignAddress,
      );

      return userProgress;
    } catch (error) {
      if (error instanceof CampaignNotFoundError) {
        throw new HttpException(
          {
            message: 'Campaign not found',
            chainId,
            campaignAddress,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw error;
    }
  }
}
