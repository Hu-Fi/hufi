import { faker } from '@faker-js/faker';

import type { NotificationsConfigService } from '@/config';

export const mockNotificationsConfigService: Omit<
  NotificationsConfigService,
  'configService'
> = {
  hufiTgBotUrl: faker.internet.url(),
  hufiTgBotClientId: faker.number.int().toString(),
};
