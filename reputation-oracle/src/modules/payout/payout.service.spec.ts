import { ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { of } from 'rxjs';

import { Manifest } from '../../common/interfaces/manifest';
import { WebhookService } from '../webhook/webhook.service';

import { PayoutService } from './payout.service';

jest.mock('@human-protocol/sdk');

describe('PayoutService', () => {
  let service: PayoutService;
  let httpService: HttpService;
  let webhookService: WebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
        {
          provide: WebhookService,
          useValue: {
            createIncomingWebhook: jest.fn(),
            processPendingCronJob: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PayoutService>(PayoutService);
    httpService = module.get<HttpService>(HttpService);
    webhookService = module.get<WebhookService>(WebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enableCron', () => {
    it('should enable the cron job', () => {
      service.enableCron();
      expect((service as any).cronEnabled).toBe(true);
    });
  });

  describe('disableCron', () => {
    it('should disable the cron job', () => {
      service.disableCron();
      expect((service as any).cronEnabled).toBe(false);
    });
  });

  describe('handleCron', () => {
    it('should not process payouts if cron is disabled', async () => {
      service.disableCron();
      await service.handleCron();
      expect(webhookService.processPendingCronJob).not.toHaveBeenCalled();
    });

    it('should process payouts if cron is enabled', async () => {
      service.enableCron();
      jest.spyOn(service as any, 'processPayouts').mockResolvedValue(undefined);
      await service.handleCron();
      expect((service as any).processPayouts).toHaveBeenCalled();
    });
  });

  describe('manualPayout', () => {
    it('should disable cron and process payouts', async () => {
      jest.spyOn(service, 'disableCron').mockImplementation();
      jest.spyOn(service as any, 'processPayouts').mockResolvedValue(undefined);

      await service.manualPayout();

      expect(service.disableCron).toHaveBeenCalled();
      expect((service as any).processPayouts).toHaveBeenCalled();
    });
  });

  describe('processPayouts', () => {
    const campaignsMock = [
      {
        manifestUrl: 'http://example.com/manifest1',
        escrowAddress: '0x1',
        chainId: 1,
      },
      {
        manifestUrl: 'http://example.com/manifest2',
        escrowAddress: '0x2',
        chainId: 1,
      },
    ];

    const manifestMock: Manifest = {
      chainId: 1,
      requesterAddress: '0xRequesterAddress',
      exchangeName: 'TestExchange',
      token: 'TEST',
      duration: 100,
      fundAmount: 1000,
      startBlock: 123456,
      endBlock: 123556,
      type: 'TestType',
    };

    const axiosResponse: AxiosResponse<Manifest> = {
      data: manifestMock,
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders(),
      },
    };

    beforeEach(() => {
      jest.spyOn(service, 'fetchCampaigns').mockImplementation(async () => {
        (service as any).campaigns = campaignsMock.map((campaign) => ({
          ...campaign,
          ...manifestMock,
        }));
      });
    });

    it('should fetch campaigns and create webhooks', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(of(axiosResponse));
      await service['processPayouts']();

      expect(service['fetchCampaigns']).toHaveBeenCalledWith(ChainId.ALL);
      expect(webhookService.createIncomingWebhook).toHaveBeenCalledTimes(2);
    });

    it('should process pending webhooks', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(of(axiosResponse));
      await service['processPayouts']();

      expect(webhookService.processPendingCronJob).toHaveBeenCalled();
    });
  });
});
