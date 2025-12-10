import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  GetCampaignsResponseDto,
  CampaignDataWithDetails,
  GetCampaignsQueryDto,
  CampaignLeaderboardResponseDto,
  SpecificCampaignParamsDto,
} from './campaigns.dto';
import { CampaignsControllerErrorsFilter } from './campaigns.error-filter';
import { CampaignsService } from './campaigns.service';

const SPECIFIC_CAMPAIGN_ROUTE = '/:chain_id-:campaign_address';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseFilters(CampaignsControllerErrorsFilter)
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @ApiOperation({
    summary: 'Get campaigns',
    description: 'Returns a list of campaigns for provided chainId and filters',
  })
  @ApiResponse({
    status: 200,
    type: GetCampaignsResponseDto,
  })
  @Get('/')
  async getCampaigns(
    @Query() query: GetCampaignsQueryDto,
  ): Promise<GetCampaignsResponseDto> {
    const chainId = query.chainId;
    const limit = query.limit;

    const campaigns = await this.campaignsService.getCampaigns(
      chainId,
      {
        launcherAddress: query.launcher,
        statuses: query.status ? [query.status] : [],
      },
      {
        limit: limit + 1,
        skip: query.skip,
      },
    );

    return {
      hasMore: campaigns.length > limit,
      results: campaigns.slice(0, limit),
    };
  }

  @ApiOperation({
    summary: 'Get campaign with details',
    description: 'Returns full details about specific campaign',
  })
  @ApiResponse({
    status: 200,
    type: CampaignDataWithDetails,
  })
  @Header('Cache-Control', 'public, max-age=60')
  @Get(SPECIFIC_CAMPAIGN_ROUTE)
  async getCampaignWithDetails(
    @Param() params: SpecificCampaignParamsDto,
  ): Promise<CampaignDataWithDetails> {
    const { chainId, campaignAddress } = params;

    const campaign = await this.campaignsService.getCampaignWithDetails(
      chainId,
      campaignAddress,
    );

    if (!campaign) {
      throw new NotFoundException();
    }

    return campaign;
  }

  @ApiOperation({
    summary: 'Get leaderboard for campaign',
    description: 'Returns leaderboard data for specific campaign',
  })
  @ApiResponse({
    status: 200,
    type: CampaignLeaderboardResponseDto,
  })
  @Header('Cache-Control', 'public, max-age=600')
  @Get(`${SPECIFIC_CAMPAIGN_ROUTE}/leaderboard`)
  async getCampaignLeaderboard(
    @Param() params: SpecificCampaignParamsDto,
  ): Promise<CampaignLeaderboardResponseDto> {
    const { chainId, campaignAddress } = params;

    const data = await this.campaignsService.getCampaignLeaderboard(
      chainId,
      campaignAddress,
    );

    return { data };
  }
}
