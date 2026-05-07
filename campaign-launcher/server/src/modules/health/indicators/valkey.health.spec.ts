import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-vitest';
import { HealthIndicatorService } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { afterEach, beforeAll, describe, expect, test } from 'vitest';

import { ValkeyClient } from '@/infrastructure/valkey';

import { ValkeyHealthIndicator } from './valkey.health';

const mockValkeyClient = createMock<ValkeyClient>(undefined, {
  strict: true,
});
(mockValkeyClient as any).clientName = faker.lorem.slug();

describe('ValkeyHealthIndicator', () => {
  let valkeyHealthIndicator: ValkeyHealthIndicator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ValkeyHealthIndicator, HealthIndicatorService],
    }).compile();

    valkeyHealthIndicator = moduleRef.get<ValkeyHealthIndicator>(
      ValkeyHealthIndicator,
    );
  });

  afterEach(() => {
    mockValkeyClient.ping.mockReset();
  });

  describe('isHealty', () => {
    test('should return healthy status if can ping', async () => {
      mockValkeyClient.ping.mockResolvedValueOnce('PONG');

      const testKey = faker.lorem.slug();

      const healthIndicatorResult = await valkeyHealthIndicator.isHealthy(
        testKey,
        mockValkeyClient,
      );

      expect(healthIndicatorResult).toEqual({
        [testKey]: { status: 'up' },
      });
    });

    test(`should throw with unhealthy status if can't ping`, async () => {
      const mockNetworkError = new Error('Ooops! Redis network error');
      mockValkeyClient.ping.mockRejectedValueOnce(mockNetworkError);

      const testKey = faker.lorem.slug();

      const healthIndicatorResult = await valkeyHealthIndicator.isHealthy(
        testKey,
        mockValkeyClient,
      );

      expect(healthIndicatorResult).toEqual({
        [testKey]: {
          status: 'down',
          message: `Unable to ping ${mockValkeyClient.clientName} Valkey`,
        },
      });
    });
  });
});
