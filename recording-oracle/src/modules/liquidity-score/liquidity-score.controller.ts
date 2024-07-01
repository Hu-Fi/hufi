import { UploadFile } from '@human-protocol/sdk';
import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CronAuthGuard } from '../../common/guards/cron-auth.guard';

import { LiquidityScoreCalculateRequestDto } from './liquidity-score.dto';
import { LiquidityScoreService } from './liquidity-score.service';

@ApiTags('Liquidity Score')
@Controller('liquidity-score')
export class LiquidityScoreController {
  constructor(private readonly liquidityScoreService: LiquidityScoreService) {}

  @UseGuards(ApiKeyGuard)
  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate the liquidity score',
    description:
      "Calculates the liquidity score for the given campaign.\n\n*This endpoint will be deprecated once it's confirmed that the cron job is running correctly.*",
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
  })
  @ApiBody({
    description: 'Campaign chain Id and address to calculate liquidity score',
    type: LiquidityScoreCalculateRequestDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Liquidity score calculated successfully, and uploaded',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async calculateLiquidityScore(
    @Body() payload: LiquidityScoreCalculateRequestDto,
  ): Promise<UploadFile | null> {
    return await this.liquidityScoreService.calculateLiquidityScore(payload);
  }

  @UseGuards(CronAuthGuard)
  @Get('cron')
  @ApiOperation({
    summary: 'Cron job to calculate liquidity score',
    description: 'Cron job to calculate the liquidity score for all campaigns.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Liquidity score calculated successfully, and uploaded',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async cronCalculateLiquidityScore(): Promise<void> {
    await this.liquidityScoreService.calculateScoresForCampaigns();
  }
}
