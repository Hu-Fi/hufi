import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExchangesConfigService {
  constructor(private configService: ConfigService) {}

  get isPancakeswapEnabled(): boolean {
    return this.configService.get('FEATURE_PANCAKESWAP', '') === 'true';
  }
}
