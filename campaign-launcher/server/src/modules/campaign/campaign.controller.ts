import { ChainId } from '@human-protocol/sdk';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ApiKeyGuard } from '../../common/guards/api-key.guard';

import { CampaignDataDto, CreateCampaignDto } from './campaign.dto';
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
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by campaign status',
  })
  @ApiQuery({
    name: 'exchangeName',
    required: false,
    description: 'Filter by exchange name',
  })
  @ApiQuery({
    name: 'launcher',
    required: false,
    description: 'Filter by launcher',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaigns list',
    type: Array<CampaignDataDto>,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getCampaigns(
    @Query('chainId') chainId: ChainId,
    @Query('status') status?: string,
    @Query('exchangeName') exchangeName?: string,
    @Query('launcher') launcher?: string,
  ) {
    return this.campaignService.getCampaigns(
      chainId,
      status,
      exchangeName,
      launcher,
    );
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

  @Get('/stats')
  @ApiOperation({
    summary: 'Get campaign stats: active count and total funds in USD',
  })
  @ApiQuery({
    name: 'chainId',
    required: false,
    enum: ChainId,
    description: 'Optional chain ID to filter campaigns',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign statistics',
    schema: {
      example: {
        activeCampaigns: 4,
        totalFundsUSD: 12345.67,
      },
    },
  })
  async getCampaignStats(@Query('chainId') chainId: ChainId) {
    return this.campaignService.getCampaignStats(chainId);
  }

  @Post('/')
  @ApiOperation({ summary: 'Create a new campaign' })
  @UseGuards(ApiKeyGuard)
  @ApiHeader({
    name: 'x-api-key',
    required: true,
    description: 'API key',
  })
  @ApiBody({ type: CreateCampaignDto })
  @ApiResponse({
    status: 201,
    description: 'Campaign created',
  })
  async createCampaign(@Body() campaignData: CreateCampaignDto) {
    return this.campaignService.createCampaign(campaignData);
  }
}
