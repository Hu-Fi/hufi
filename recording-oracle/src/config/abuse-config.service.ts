import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AbuseConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Abuse detection mechanism uses this sample rate value
   * in order to store some trades for internal usage.
   * Default: 100
   */
  get tradesSampleRate(): number {
    return Number(this.configService.get('ABUSE_TRADES_SAMPLE_RATE')) || 100;
  }
}
