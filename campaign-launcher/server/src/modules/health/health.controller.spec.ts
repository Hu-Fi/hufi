import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';

import { ServerConfigService } from '@/config';
import { nestLoggerOverride } from '@/logger';

import { HealthController } from './health.controller';

const mockServerConfigService = {
  gitHash: faker.git.commitSha(),
};

describe('HealthController', () => {
  let healthController: HealthController;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ServerConfigService,
          useValue: mockServerConfigService,
        },
      ],
    });

    /**
     * Terminus uses nest logger internaly,
     * so override to omit logs in tests
     */
    moduleBuilder.setLogger(nestLoggerOverride);

    const moduleRef = await moduleBuilder.compile();

    healthController = moduleRef.get(HealthController);
  });

  it('/ping should return proper info', async () => {
    await expect(healthController.ping()).resolves.toEqual({
      gitHash: mockServerConfigService.gitHash,
      nodeEnv: 'test',
    });
  });
});
