import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsConfigService {
  constructor(private configService: ConfigService) {}

  get hufiTgBotUrl(): string {
    const url = this.configService.get('HUFI_TG_BOT_URL') || '';

    return url.replace(/\/+$/, '');
  }

  get hufiTgBotClientId(): string {
    return this.configService.getOrThrow('HUFI_TG_BOT_CLIENT_ID');
  }
}
