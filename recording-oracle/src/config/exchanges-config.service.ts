import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExchangesConfigService {
  constructor(private configService: ConfigService) {}

  get useSandbox(): boolean {
    return this.configService.get('USE_EXCHANGE_SANDBOX', '') === 'true';
  }
}
