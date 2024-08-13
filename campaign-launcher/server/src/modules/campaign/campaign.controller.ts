import { ChainId } from '@human-protocol/sdk';
import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CampaignDataDto } from './campaign.dto';
import { CampaignService } from './campaign.service';

@ApiTags('campaign')
@Controller('campaign')
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get campaigns for the given chain ID' })
  @ApiQuery({
    name: 'chainId',
    required: false,
    enum: ChainId,
    description: 'Chain ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaigns list',
    type: Array<CampaignDataDto>,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getCampaigns(@Query('chainId') chainId: ChainId) {
    return this.campaignService.getCampaigns(chainId);
  }

  @Get('/:chainId/:escrowAddress')
  @ApiOperation({
    summary: 'Get the campaign data for the given chain Id and escrow address',
  })
  @ApiParam({ name: 'chainId', required: true, enum: ChainId })
  @ApiParam({ name: 'escrowAddress', required: true })
  @ApiResponse({
    status: 200,
    description: 'Campaign data',
    type: CampaignDataDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getCampaign(
    @Param('chainId') chainId: ChainId,
    @Param('escrowAddress') escrowAddress: string,
  ) {
    return this.campaignService.getCampaign(chainId, escrowAddress);
  }
}
