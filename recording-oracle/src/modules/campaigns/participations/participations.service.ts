import { Injectable } from '@nestjs/common';

import { isDuplicatedError } from '@/infrastructure/database';

import type { CampaignEntity } from '../campaign.entity';
import { isThresholdCampaign } from '../type-guards';
import { ParticipationEntity } from './participation.entity';
import { UserAlreadyJoinedError } from './participations.errors';
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
        throw new UserAlreadyJoinedError(campaign.id, userId);
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

  async checkParticipantLimitReached(
    campaign: CampaignEntity,
  ): Promise<boolean> {
    if (!isThresholdCampaign(campaign)) {
      return false;
    }

    if (!campaign.details.maxParticipants) {
      return false;
    }

    const nParticipants = await this.participationsRepository.countParticipants(
      campaign.id,
    );

    return nParticipants >= campaign.details.maxParticipants;
  }
}
