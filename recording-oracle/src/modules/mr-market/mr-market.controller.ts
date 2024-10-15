import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';

import { ApiKeyGuard } from '../../common/guards/api-key.guard';

import {
  CampaignRegisterRequestDto,
  CampaignRegisterResponseDto,
} from './mr-market.dto';
import { MrMarketService } from './mr-market.service';

@ApiTags('Mr.Market')
@Controller('mr-market')
export class MrMarketController {
  constructor(private readonly mrMarketService: MrMarketService) {}

  @Post('campaign')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
  })
  @ApiOperation({
    summary: 'Register Mr.Market to the campaign',
    description:
      'Registers Mr.Market to the campaign. Exchange API key is required to be registered.',
  })
  @ApiBody({
    type: CampaignRegisterRequestDto,
    description: 'Wallet address, Campaign details, and Exchange API key.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registered Mr.Market to the campaign successfully.',
    type: CampaignRegisterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  public async registerForCampaign(
    @Body() data: CampaignRegisterRequestDto,
  ): Promise<CampaignRegisterResponseDto> {
    await this.mrMarketService.registerToCampaign(data);
    return { success: true };
  }
}
