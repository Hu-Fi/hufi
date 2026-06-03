import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsConfigService {
  constructor(private configService: ConfigService) {}

  get hufiTgBotUrl(): string {
    return this.configService.get('HUFI_TG_BOT_URL') || '';
  }

  get hufiTgBotClientId(): string {
    const url = this.configService.getOrThrow<string>('HUFI_TG_BOT_CLIENT_ID');

    return url.replace(/\/+$/, '');
  }
}
