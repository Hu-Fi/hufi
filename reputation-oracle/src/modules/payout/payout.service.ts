import { EscrowUtils, ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { lastValueFrom } from 'rxjs';

import { Web3ConfigService } from '../../common/config/web3-config.service';
import { SUPPORTED_CHAIN_IDS } from '../../common/constants/networks';
import { EventType } from '../../common/enums';
import { Manifest } from '../../common/interfaces/manifest';
import { WebhookIncomingDto } from '../webhook/webhook.dto';
import { WebhookService } from '../webhook/webhook.service'; // Import WebhookService

interface CampaignWithManifest extends Manifest {
  escrowAddress: string;
  status: string;
}

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);
  private campaigns: Array<CampaignWithManifest> = [];
  private cronEnabled: boolean = false; // Flag to control the cron job

  constructor(
    private web3ConfigService: Web3ConfigService,
    private httpService: HttpService,
    private webhookService: WebhookService, // Inject WebhookService
  ) {}

  async fetchCampaigns(chainId: number): Promise<void> {
    try {
      const campaigns = await EscrowUtils.getEscrows({
        networks: chainId === ChainId.ALL ? SUPPORTED_CHAIN_IDS : [chainId],
        recordingOracle: this.web3ConfigService.recordingOracle,
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
              status: campaign.status,
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
  async manualPayout(chainId = ChainId.ALL): Promise<void> {
    this.disableCron();
    await this.processPayouts(chainId);
  }

  // Process the payouts (used by both cron and manual methods)
  private async processPayouts(chainId = ChainId.ALL): Promise<void> {
    // Ensure campaigns are fetched before executing cron job
    await this.fetchCampaigns(chainId);

    // Iterate over each campaign and create a webhook
    for (const campaign of this.campaigns) {
      // Only Pending or Partial
      if (campaign.status !== 'Pending' && campaign.status !== 'Partial') {
        continue;
      }

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
