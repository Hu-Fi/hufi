import { Controller, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { PayoutService } from './payout.service';

@ApiTags('Payout')
@Controller('payout')
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @ApiOperation({ summary: 'Manually execute payouts and disable auto cron' })
  @ApiResponse({
    status: 200,
    description: 'Manual payout executed',
  })
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
}
