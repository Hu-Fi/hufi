import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

import { ValkeyClient } from '@/infrastructure/valkey';

@Injectable()
export class ValkeyHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string, valkeyClient: ValkeyClient) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await valkeyClient.ping();

      return indicator.up();
    } catch {
      return indicator.down(`Unable to ping ${valkeyClient.clientName} Valkey`);
    }
  }
}
