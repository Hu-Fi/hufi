import { Injectable } from '@nestjs/common';

import { VolumeStatsRepository } from '@/modules/campaigns';

@Injectable()
export class StatisticsService {
  constructor(private readonly volumeStatsRepository: VolumeStatsRepository) {}

  async getTotalVolume() {
    /**
     * TODO: add in-memory caching
     */
    const totalVolume = await this.volumeStatsRepository.calculateTotalVolume();

    return totalVolume;
  }
}
