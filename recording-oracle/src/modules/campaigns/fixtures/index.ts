import { faker } from '@faker-js/faker';

import { CampaignsConfigService } from '@/config';

export * from './campaign';
export * from './manifest';

export const mockCampaignsConfigService: Omit<
  CampaignsConfigService,
  'configService'
> = {
  isHoldingJoinLimitEnabled: false,
  /**
   * Keep this reasonably small for test purpose
   */
  storeResultsTimeout: faker.number.int({ min: 10, max: 50 }),
};
