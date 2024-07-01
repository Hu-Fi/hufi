import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CronAuthGuard } from '../../common/guards/cron-auth.guard';

import { PayoutService } from './payout.service';

@ApiTags('Payout') // Add API tag for grouping
@Controller('payout')
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @ApiOperation({ summary: 'Manually execute payouts and disable auto cron' }) // Add operation summary
  @ApiResponse({
    status: 200,
    description: 'Manual payout executed',
  }) // Add response description
  @Post('manual-payout')
  async manualPayout() {
    await this.payoutService.processPayouts();
    return { message: 'Manual payout executed' };
  }

  @ApiOperation({ summary: 'Manually execute payouts for chain id' })
  @ApiResponse({
    status: 200,
    description: 'Manual payout executed',
  })
  @ApiParam({ name: 'chainId', description: 'Chain ID', required: true })
  @Post('manual-payout/:chainId')
  async manualPayoutForChainId(@Param('chainId') chainId: number) {
    await this.payoutService.processPayouts(chainId);
    return { message: 'Manual payout executed' };
  }

  @UseGuards(CronAuthGuard)
  @ApiOperation({ summary: 'Cron job to execute payouts' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Cron job executed',
  })
  @Get('cron/process-payout')
  async cronPayout() {
    await this.payoutService.processPayouts();
    return { message: 'Cron job executed' };
  }

  @UseGuards(CronAuthGuard)
  @ApiOperation({ summary: 'Cron job to finalize campaigns' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Cron job executed',
  })
  @Get('cron/finalize-campaign')
  async cronFinalize() {
    await this.payoutService.finalizeCampaigns();
    return { message: 'Cron job executed' };
  }
}
