import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators';

import { WebhookIncomingDto } from './webhook.dto';
import { WebhookService } from './webhook.service';

@Public()
@ApiTags('Webhook')
@Controller('/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  // @UseGuards(new SignatureAuthGuard([Role.Recording]))
  @Post('/')
  public async createIncomingWebhook(
    // @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() data: WebhookIncomingDto,
  ): Promise<boolean> {
    return this.webhookService.createIncomingWebhook(data);
  }

  @Public()
  @Get('/cron/pending')
  public async processPendingCronJob(): Promise<any> {
    return this.webhookService.processPendingWebhooks();
  }
}
