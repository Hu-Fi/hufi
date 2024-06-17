import { Controller, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { PayoutService } from './payout.service';

@ApiTags('Payout') // Add API tag for grouping
@Controller('payout')
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @ApiOperation({ summary: 'Enable the cron job' }) // Add operation summary
  @ApiResponse({ status: 200, description: 'Cron job enabled' }) // Add response description
  @Post('cron/enable')
  enableCron() {
    this.payoutService.enableCron();
    return { message: 'Cron job enabled' };
  }

  @ApiOperation({ summary: 'Disable the cron job' }) // Add operation summary
  @ApiResponse({ status: 200, description: 'Cron job disabled' }) // Add response description
  @Post('cron/disable')
  disableCron() {
    this.payoutService.disableCron();
    return { message: 'Cron job disabled' };
  }

  @ApiOperation({ summary: 'Manually execute payouts and disable auto cron' }) // Add operation summary
  @ApiResponse({
    status: 200,
    description: 'Manual payout executed and cron job disabled',
  }) // Add response description
  @Post('manual-payout')
  async manualPayout() {
    await this.payoutService.manualPayout();
    return { message: 'Manual payout executed and cron job disabled' };
  }

  @ApiOperation({ summary: 'Manually execute payouts for chain id' })
  @ApiResponse({
    status: 200,
    description: 'Manual payout executed and cron job disabled',
  })
  @ApiParam({ name: 'chainId', description: 'Chain ID', required: true })
  @Post('manual-payout/:chainId')
  async manualPayoutForChainId(@Param('chainId') chainId: number) {
    await this.payoutService.manualPayout(chainId);
    return { message: 'Manual payout executed and cron job disabled' };
  }
}
