import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisConfigService {
  constructor(private configService: ConfigService) {}

  get cacheUrl(): string {
    return this.configService.getOrThrow('REDIS_CACHE_URL');
  }
}
