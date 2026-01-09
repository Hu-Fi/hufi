import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { ServiceUnavailableException } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorStatus,
  TerminusModule,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Test } from '@nestjs/testing';

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

const mockTypeOrmPingCheck = jest.fn();

const mockValkeyCacheClient = createMock<ValkeyClient>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(mockValkeyCacheClient as any).clientName = faker.lorem.slug();

function generateMockHealthIndicatorResult(
  testKey: string,
  status: HealthIndicatorStatus,
): HealthIndicatorResult {
  return {
    [testKey]: {
      status,
    },
  };
}

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

  it('/ping should return proper info', async () => {
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
      DB = 'database',
      CACHE = 'cache-client',
    }

    beforeEach(() => {
      mockTypeOrmPingCheck.mockResolvedValueOnce(
        generateMockHealthIndicatorResult(ExpectedDepKey.DB, CheckStatus.UP),
      );
      mockValkeyCacheClient.ping.mockResolvedValueOnce('PONG');
    });

    it(`should return 'up' when all deps are up`, async () => {
      await expect(healthController.check()).resolves.toEqual(
        expect.objectContaining({
          status: 'ok',
          info: {
            [ExpectedDepKey.DB]: {
              status: CheckStatus.UP,
            },
            [ExpectedDepKey.CACHE]: {
              status: CheckStatus.UP,
            },
          },
          error: {},
        }),
      );
    });

    it(`should return 'down' when db is down`, async () => {
      mockTypeOrmPingCheck
        .mockReset()
        .mockResolvedValueOnce(
          generateMockHealthIndicatorResult(
            ExpectedDepKey.DB,
            CheckStatus.DOWN,
          ),
        );

      let thrownError;
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
            [ExpectedDepKey.DB]: {
              status: CheckStatus.DOWN,
            },
          },
        }),
      );
      expect(mockTypeOrmPingCheck).toHaveBeenCalledTimes(1);
      expect(mockTypeOrmPingCheck).toHaveBeenCalledWith(ExpectedDepKey.DB, {
        timeout: 5000,
      });
    });

    it(`should return 'down' when cache is down`, async () => {
      mockValkeyCacheClient.ping
        .mockReset()
        .mockRejectedValueOnce(new Error('timeout'));

      let thrownError;
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
