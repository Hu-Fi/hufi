import { EscrowUtils, ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { lastValueFrom } from 'rxjs';

import { SUPPORTED_CHAIN_IDS } from '../../common/constants/networks';
import { EventType } from '../../common/enums';
import { Manifest } from '../../common/interfaces/manifest';
import { WebhookIncomingDto } from '../webhook/webhook.dto';
import { WebhookService } from '../webhook/webhook.service'; // Import WebhookService

interface CampaignWithManifest extends Manifest {
  escrowAddress: string;
}

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);
  private campaigns: Array<CampaignWithManifest> = [];
  private cronEnabled: boolean = false; // Flag to control the cron job

  constructor(
    private httpService: HttpService,
    private webhookService: WebhookService, // Inject WebhookService
  ) {}

  async fetchCampaigns(chainId: number): Promise<void> {
    try {
      const campaigns = await EscrowUtils.getEscrows({
        networks: chainId === ChainId.ALL ? SUPPORTED_CHAIN_IDS : [chainId],
        recordingOracle: process.env.RECORDING_ORACLE,
      });

      const campaignsWithManifest: Array<CampaignWithManifest> =
        await Promise.all(
          campaigns.map(async (campaign) => {
            let manifest;

            try {
              const response = await lastValueFrom(
                this.httpService.get(campaign.manifestUrl),
              );
              manifest = response.data;
            } catch {
              manifest = undefined;
            }

            if (!manifest) {
              return undefined;
            }

            return {
              ...manifest,
              escrowAddress: campaign.address,
              chainId: campaign.chainId,
            } as CampaignWithManifest;
          }),
        );

      this.campaigns = campaignsWithManifest.filter(
        (campaign) => campaign !== undefined,
      );
    } catch (e: any) {
      this.logger.error('Error fetching campaigns:', e);
      throw new Error(e);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    if (!this.cronEnabled) {
      this.logger.log('Cron job is disabled.');
      return;
    }

    await this.processPayouts();
  }

  // Method to enable the cron job
  enableCron() {
    this.cronEnabled = true;
    this.logger.log('Cron job enabled.');
  }

  // Method to disable the cron job
  disableCron() {
    this.cronEnabled = false;
    this.logger.log('Cron job disabled.');
  }

  // Method to manually execute payouts and disable auto cron
  async manualPayout(): Promise<void> {
    this.disableCron();
    await this.processPayouts();
  }

  // Process the payouts (used by both cron and manual methods)
  private async processPayouts(): Promise<void> {
    // Ensure campaigns are fetched before executing cron job
    await this.fetchCampaigns(ChainId.ALL);

    // Iterate over each campaign and create a webhook
    for (const campaign of this.campaigns) {
      const data: WebhookIncomingDto = {
        chainId: campaign.chainId,
        eventType: EventType.CAMPAIGN_PAYOUT,
        escrowAddress: campaign.escrowAddress,
      };

      try {
        await this.webhookService.createIncomingWebhook(data);
        this.logger.log(
          'Webhook created for campaign:',
          campaign.escrowAddress,
        );
      } catch (error) {
        this.logger.error(
          'Error creating webhook for campaign:',
          campaign.escrowAddress,
          error,
        );
      }
    }

    // Process pending webhooks
    try {
      const processed = await this.webhookService.processPendingCronJob();
      if (processed) {
        this.logger.log('Pending webhooks processed successfully.');
      } else {
        this.logger.log('No pending webhooks to process.');
      }
    } catch (error) {
      this.logger.error('Error processing pending webhooks:', error);
    }
  }
}
