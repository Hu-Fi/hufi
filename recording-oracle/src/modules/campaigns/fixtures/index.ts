import { CampaignsConfigService } from '@/config';

export * from './campaign';
export * from './manifest';

export const mockCampaignsConfigService: Omit<
  CampaignsConfigService,
  'configService'
> = {
  isHoldingJoinLimitEnabled: false,
};
