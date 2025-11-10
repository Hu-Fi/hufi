import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CampaignsConfigService {
  constructor(private configService: ConfigService) {}

  get isHoldingJoinLimitEnabled(): boolean {
    return this.configService.get('FEATURE_LIMIT_HOLDING_JOIN') === 'true';
  }
}
