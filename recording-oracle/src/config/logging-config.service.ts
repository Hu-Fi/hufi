import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingConfigService {
  constructor(private configService: ConfigService) {}

  get logExchangePermissionErrors(): boolean {
    return (
      this.configService.get('LOG_EXCHANGE_PERMISSION_ERRORS', '') === 'true'
    );
  }
}
