import { Injectable } from '@nestjs/common';

import { isDuplicatedError } from '@/infrastructure/database';

import type { CampaignEntity } from '../campaign.entity';
import { isThresholdCampaign } from '../type-guards';
import { ParticipationEntity } from './participation.entity';
import { ParticipationsRepository } from './participations.repository';

@Injectable()
export class ParticipationsService {
  constructor(
    private readonly participationsRepository: ParticipationsRepository,
  ) {}

  async joinCampaign(userId: string, campaign: CampaignEntity): Promise<void> {
    const participation = new ParticipationEntity();
    participation.userId = userId;
    participation.campaignId = campaign.id;
    participation.createdAt = new Date();

    let participantsLimit: number | undefined;
    if (isThresholdCampaign(campaign)) {
      participantsLimit = campaign.details.maxParticipants;
    }

    try {
      await this.participationsRepository.safeInsert(
        participation,
        participantsLimit,
      );
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
    const participation =
      await this.participationsRepository.findByUserAndCampaign(
        userId,
        campaignId,
      );

    if (!participation) {
      return null;
    }

    return participation.createdAt.toISOString();
  }
}
