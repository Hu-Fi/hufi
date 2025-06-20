import { EscrowUtils, ChainId, EscrowClient } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { lastValueFrom } from 'rxjs';

import { EventType } from '../../common/enums';
import { Manifest } from '../../common/interfaces/manifest';
import { PgLockService } from '../../database/pg-lock.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookIncomingDto } from '../webhook/webhook.dto';
import { WebhookService } from '../webhook/webhook.service';

interface CampaignWithManifest extends Manifest {
  escrowAddress: string;
  intermediateResutlsUrl?: string;
  status: string;
}

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private web3Service: Web3Service,
    private httpService: HttpService,
    private webhookService: WebhookService,
    private readonly pgLockService: PgLockService,
  ) {}

  async fetchCampaigns(chainId: number): Promise<CampaignWithManifest[]> {
    let supportedChainIds = [chainId];

    if (chainId === ChainId.ALL) {
      supportedChainIds = this.web3Service.getValidChains();
    }

    const allCampaigns = [];

    for (const supportedChainId of supportedChainIds) {
      try {
        const campaigns = await EscrowUtils.getEscrows({
          chainId: supportedChainId,
          reputationOracle: this.web3Service.getOperatorAddress(),
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
                intermediateResutlsUrl: campaign.intermediateResultsUrl,
                chainId: campaign.chainId,
                status: campaign.status,
              } as CampaignWithManifest;
            }),
          );

        allCampaigns.push(
          ...campaignsWithManifest.filter((campaign) => !!campaign),
        );
      } catch (e: any) {
        this.logger.error('Error fetching campaigns:', e);
      }
    }

    return allCampaigns;
  }

  /**
   * Cron job to process the campaign payouts.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  // Process the payouts (used by both cron and manual methods)
  async processPayouts(chainId = ChainId.ALL): Promise<void> {
    this.logger.log(`Processing payouts for campaigns.  - PID: ${process.pid}`);
    await this.pgLockService.withLock('cron:processPayouts', async () => {
      // Ensure campaigns are fetched before executing cron job
      const campaigns = await this.fetchCampaigns(chainId);

      // Iterate over each campaign and create a webhook
      for (const campaign of campaigns) {
        // Only Pending or Partial
        if (campaign.status !== 'Pending' && campaign.status !== 'Partial') {
          continue;
        }

        this.logger.log(
          `Processing escrow address: ${campaign.escrowAddress}`,
          WebhookService.name,
        );

        // Get the intermediateResultsUrl from the escrow
        const intermediateResultsUrl = campaign.intermediateResutlsUrl;

        if (!intermediateResultsUrl) {
          this.logger.warn(
            `Intermediate result URL not found for ${campaign.escrowAddress}`,
          );
          continue;
        }

        if (
          await this.webhookService.checkIfExists(
            campaign.chainId,
            campaign.escrowAddress,
            intermediateResultsUrl,
          )
        ) {
          this.logger.warn(
            `An Incoming Webhook for the results of ${campaign.escrowAddress} on chain id ${campaign.chainId} save in url ${intermediateResultsUrl} Already Exists `,
          );
          continue;
        }
        const data: WebhookIncomingDto = {
          chainId: campaign.chainId,
          eventType: EventType.CAMPAIGN_PAYOUT,
          escrowAddress: campaign.escrowAddress,
          payload: intermediateResultsUrl,
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
    });
  }

  /**
   * Cron job to cancel expired campaigns / complete the finished campaigns.
   */
  @Cron(CronExpression.EVERY_DAY_AT_4PM)
  async finalizeCampaigns(): Promise<void> {
    this.logger.log(`Checking expired campaigns.  - PID: ${process.pid}`);
    await this.pgLockService.withLock('cron:finalizeCampaigns', async () => {
      // Ensure campaigns are fetched before executing cron job
      const campaigns = await this.fetchCampaigns(ChainId.ALL);

      // Iterate over each campaign and finalize it
      for (const campaign of campaigns) {
        try {
          const signer = this.web3Service.getSigner(campaign.chainId);
          const escrowClient = await EscrowClient.build(signer);

          const escrow = await EscrowUtils.getEscrow(
            campaign.chainId,
            campaign.escrowAddress,
          );

          const balance = BigInt(escrow.balance);

          if (balance === 0n) {
            if (campaign.status === 'Paid') {
              this.logger.log(
                `Completing campaign: ${campaign.chainId} - ${campaign.escrowAddress}`,
              );

              const gasPrice = await this.web3Service.calculateGasPrice(
                campaign.chainId,
              );

              try {
                await escrowClient.complete(campaign.escrowAddress, {
                  gasPrice,
                });
              } catch {
                this.logger.error(
                  `Failed to complete campaign: ${campaign.chainId} - ${campaign.escrowAddress}`,
                );
              }
            }
          } else {
            if (campaign.endBlock * 1000 < new Date().getTime()) {
              this.logger.log(
                `Cancelling campaign: ${campaign.chainId} - ${campaign.escrowAddress}`,
              );

              const gasPrice = await this.web3Service.calculateGasPrice(
                campaign.chainId,
              );

              try {
                await escrowClient.cancel(campaign.escrowAddress, {
                  gasPrice: gasPrice,
                });
              } catch (error) {
                this.logger.error(
                  `Failed to cancel campaign: ${campaign.chainId} - ${campaign.escrowAddress}`,
                  error,
                );
              }
            }
          }
        } catch (error) {
          this.logger.error('Error finalizing campaign:', error);
        }
      }
    });
  }
}
