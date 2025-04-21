import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
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

  @Get('campaign')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({ name: 'x-api-key', description: 'API key for authentication' })
  @ApiOperation({ summary: 'Check campaign registration' })
  @ApiResponse({ status: 200, type: Boolean })
  public async checkCampaignRegistration(
    @Query('chainId', ParseIntPipe) chainId: number,
    @Query('walletAddress') walletAddress: string,
    @Query('address') address: string,
  ): Promise<boolean> {
    return this.mrMarketService.checkCampaignRegistration(
      chainId,
      walletAddress,
      address,
    );
  }

  @Post('campaign')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({ name: 'x-api-key', description: 'API key for authentication' })
  @ApiOperation({ summary: 'Register Mr.Market to the campaign' })
  @ApiBody({
    type: CampaignRegisterRequestDto,
    description: 'Wallet address, campaign details, exchange API key.',
  })
  @ApiResponse({ status: 200, type: CampaignRegisterResponseDto })
  public async registerForCampaign(
    @Body() data: CampaignRegisterRequestDto,
  ): Promise<CampaignRegisterResponseDto> {
    await this.mrMarketService.registerToCampaign(data);
    return { success: true };
  }
}
