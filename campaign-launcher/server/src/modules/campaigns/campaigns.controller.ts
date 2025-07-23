import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CampaignData, GetCampaignsQueryDto } from './campaigns.dto';
import { CampaignsService } from './campaigns.service';

@ApiTags('Campaigns')
@Controller('campaigns')
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
    };

    const campaigns = await this.campaignsService.getCampaigns(
      chainId,
      filters,
    );

    return campaigns;
  }
}
