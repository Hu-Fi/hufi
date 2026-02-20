import { Injectable } from '@nestjs/common';

import { isDuplicatedError } from '@/infrastructure/database';

import { ParticipationEntity } from './participation.entity';
import { ParticipationsRepository } from './participations.repository';

@Injectable()
export class ParticipationsService {
  constructor(
    private readonly participationsRepository: ParticipationsRepository,
  ) {}

  async joinCampaign(userId: string, campaignId: string): Promise<void> {
    const participation = new ParticipationEntity();
    participation.userId = userId;
    participation.campaignId = campaignId;
    participation.createdAt = new Date();

    try {
      await this.participationsRepository.insert(participation);
    } catch (error) {
      if (isDuplicatedError(error)) {
        // joined w/ race condition, noop;
      } else {
        throw error;
      }
    }
  }

  async checkUserJoinedCampaign(
    userId: string,
    campaignId: string,
  ): Promise<string | null> {
    const participation = await this.participationsRepository.findOne({
      where: {
        userId,
        campaignId,
      },
      select: {
        createdAt: true,
      },
    });

    if (!participation) {
      return null;
    }

    return participation.createdAt.toISOString();
  }
}
