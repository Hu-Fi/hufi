import {
  Body,
  Controller,
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

import { JoinCampaignDto, JoinCampaignSuccessDto } from './campaign.dto';
import { CampaignControllerErrorsFilter } from './campaign.error-filter';
import { CampaignService } from './campaign.service';

@ApiTags('Campaign')
@Controller('/campaign')
@UseFilters(CampaignControllerErrorsFilter)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @ApiBearerAuth()
  @Post('/join')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Web3 signature body',
    description: 'Endpoint for retrieving the nonce used for signing.',
  })
  @ApiBody({ type: JoinCampaignDto })
  @ApiResponse({
    status: 200,
    description: 'Nonce retrieved successfully',
    type: JoinCampaignSuccessDto,
  })
  public async joinCampaign(
    @Req() request: RequestWithUser,
    @Body() data: JoinCampaignDto,
  ): Promise<JoinCampaignSuccessDto> {
    const campaignId = await this.campaignService.join(
      request.user.id,
      data.chainId,
      data.address,
    );
    return { id: campaignId as unknown as string };
  }
}
