import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  CampaignData,
  CampaignDataWithDetails,
  GetCampaignsQueryDto,
  GetCampaignWithDetailsParamsDto,
} from './campaigns.dto';
import { CampaignsControllerErrorsFilter } from './campaigns.error-filter';
import { CampaignsService } from './campaigns.service';

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
    type: CampaignData,
    isArray: true,
  })
  @Get('/')
  async getCampaigns(
    @Query() query: GetCampaignsQueryDto,
  ): Promise<CampaignData[]> {
    const chainId = query.chainId;
    const filters = {
      exchangeName: query.exchangeName,
      launcher: query.launcher,
      status: query.status,
    };

    const campaigns = await this.campaignsService.getCampaigns(
      chainId,
      filters,
    );

    return campaigns;
  }

  @ApiOperation({
    summary: 'Get campaign with details',
    description: 'Returns full details about specific campaign',
  })
  @ApiResponse({
    status: 200,
    type: CampaignDataWithDetails,
  })
  @Get('/:chain_id-:campaign_address')
  async getCampaignWithDetails(
    @Param() params: GetCampaignWithDetailsParamsDto,
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
}
