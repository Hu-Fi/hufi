import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService {
  constructor(private configService: ConfigService) {}

  get valkeyHost(): string {
    return this.configService.getOrThrow('VALKEY_HOST');
  }

  get valkeyPort(): number {
    return Number(this.configService.get('VALKEY_PORT')) || 6379;
  }

  get valkeyDbNumber(): number {
    return Number(this.configService.getOrThrow('VALKEY_DB'));
  }
}
