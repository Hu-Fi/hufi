import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CampaignsConfigService {
  constructor(private configService: ConfigService) {}

  get isHoldingJoinLimitEnabled(): boolean {
    return this.configService.get('FEATURE_LIMIT_HOLDING_JOIN') === 'true';
  }

  /**
   * It might be that by some reason `storeResults` tx is stuck on RPC.
   * This timeout value controls the wait time before job on RecO is dropped for later retry
   * Default: 90000 (90 seconds)
   */
  get storeResultsTimeout(): number {
    const configValueSeconds =
      Number(this.configService.get('STORE_RESULTS_TIMEOUT')) || 90;
    return configValueSeconds * 1000;
  }
}
