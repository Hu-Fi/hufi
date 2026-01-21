import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ExchangeName,
  SUPPORTED_EXCHANGE_NAMES,
  type SupportedExchange,
} from '@/common/constants';

@Injectable()
export class ExchangesConfigService {
  constructor(private configService: ConfigService) {}

  private get isPancakeswapEnabled(): boolean {
    return this.configService.get('FEATURE_PANCAKESWAP', '') === 'true';
  }

  getSupportedExchanges(): Set<SupportedExchange> {
    const supportedExchanges = new Set(SUPPORTED_EXCHANGE_NAMES);

    if (this.isPancakeswapEnabled) {
      supportedExchanges.add(ExchangeName.PANCAKESWAP);
    }

    return supportedExchanges;
  }
}
