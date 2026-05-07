import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { TerminusModule, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { ServerConfigService } from '@/config';
import {
  VALKEY_CACHE_CLIENT,
  type ValkeyClient,
} from '@/infrastructure/valkey';

import { HealthController } from './health.controller';
import { ValkeyHealthIndicator } from './indicators/valkey.health';

const mockServerConfigService = {
  gitHash: faker.git.commitSha(),
};

const mockTypeOrmPingCheck = vi.fn();

const mockValkeyCacheClient = createMock<ValkeyClient>(undefined, {
  strict: true,
});
(mockValkeyCacheClient as any).clientName = faker.lorem.slug();

describe('HealthController', () => {
  let healthController: HealthController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TerminusModule.forRoot({ logger: false })],
      providers: [
        {
          provide: ServerConfigService,
          useValue: mockServerConfigService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: mockTypeOrmPingCheck,
          },
        },
        ValkeyHealthIndicator,
        {
          provide: VALKEY_CACHE_CLIENT,
          useValue: mockValkeyCacheClient,
        },
      ],
      controllers: [HealthController],
    }).compile();

    healthController = moduleRef.get(HealthController);
  });

  test('/ping should return proper info', async () => {
    await expect(healthController.ping()).resolves.toEqual({
      gitHash: mockServerConfigService.gitHash,
      nodeEnv: 'test',
    });
  });

  describe('/check', () => {
    enum CheckStatus {
      UP = 'up',
      DOWN = 'down',
    }

    enum ExpectedDepKey {
      CACHE = 'cache-client',
    }

    beforeEach(() => {
      mockValkeyCacheClient.ping.mockResolvedValueOnce('PONG');
    });

    test(`should return 'up' when all deps are up`, async () => {
      await expect(healthController.check()).resolves.toEqual(
        expect.objectContaining({
          status: 'ok',
          info: {
            [ExpectedDepKey.CACHE]: {
              status: CheckStatus.UP,
            },
          },
          error: {},
        }),
      );
    });

    test(`should return 'down' when cache is down`, async () => {
      mockValkeyCacheClient.ping
        .mockReset()
        .mockRejectedValueOnce(new Error('timeout'));

      let thrownError: any;
      try {
        await healthController.check();
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(ServiceUnavailableException);
      expect(thrownError.response).toEqual(
        expect.objectContaining({
          status: 'error',
          error: {
            [ExpectedDepKey.CACHE]: {
              status: CheckStatus.DOWN,
              message: expect.any(String),
            },
          },
        }),
      );
    });
  });
});
