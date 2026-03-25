import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { DataSource, Repository } from 'typeorm';

import { type ChainId } from '@/common/constants';
import { isNumber } from '@/common/utils/type-guard';
import type { UserEntity } from '@/modules/users';

import { CampaignEntity } from '../campaign.entity';
import { CampaignStatus } from '../types';
import { ParticipationEntity } from './participation.entity';
import { MaxParticipationsError } from './participations.errors';
import { type CampaignParticipant } from './types';

@Injectable()
export class ParticipationsRepository extends Repository<ParticipationEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(ParticipationEntity, dataSource.createEntityManager());
  }

  async findByUserAndCampaign(
    userId: string,
    campaignId: string,
  ): Promise<ParticipationEntity | null> {
    return this.findOne({
      where: {
        userId,
        campaignId,
      },
    });
  }

  async findByUserId(
    userId: string,
    options: {
      chaindId?: ChainId;
      statuses?: CampaignStatus[];
      limit?: number;
      skip?: number;
    } = {},
  ): Promise<CampaignEntity[]> {
    const query = this.createQueryBuilder('participation')
      .leftJoinAndSelect('participation.campaign', 'campaign')
      .where('participation.userId = :userId', { userId });

    if (options.chaindId) {
      query.andWhere('campaign.chainId = :chainId', {
        chainId: options.chaindId,
      });
    }

    if (options.statuses?.length) {
      query.andWhere('campaign.status IN (:...statuses)', {
        statuses: options.statuses,
      });
    }

    query.orderBy('campaign.startDate').skip(options.skip).limit(options.limit);

    const participations = await query.getMany();

    return participations.map((uc) => uc.campaign as CampaignEntity);
  }

  async findCampaignParticipants(
    campaignId: string,
  ): Promise<CampaignParticipant[]> {
    const participations = await this.find({
      where: { campaignId },
      relations: {
        user: true,
      },
    });

    return participations.map((e) => ({
      ...(e.user as UserEntity),
      campaignId,
      joinedAt: e.createdAt,
    }));
  }

  async removeUserFromActiveCampaigns(
    userId: string,
    exchangeNames: string[] = [],
  ): Promise<void> {
    const activeCampaignIdsQuery = this.manager
      .createQueryBuilder()
      .select('campaign.id')
      .from(CampaignEntity, 'campaign')
      .where('campaign.status IN (:...statuses)');

    if (exchangeNames.length) {
      activeCampaignIdsQuery.andWhere(
        'campaign.exchangeName IN (:...exchangeNames)',
      );
    }

    const removalOp = this.createQueryBuilder('participations')
      .delete()
      .where('userId = :userId', { userId })
      .andWhere(`campaignId IN (${activeCampaignIdsQuery.getQuery()})`)
      .setParameters({
        /**
         * This is necessary to call `setParameters` on main op
         * in order to get params injected into subquery
         */
        statuses: [CampaignStatus.ACTIVE, CampaignStatus.TO_CANCEL],
        exchangeNames,
      });

    await removalOp.execute();
  }

  async countParticipants(campaignId: string): Promise<number> {
    return this.count({
      where: { campaignId },
    });
  }

  async safeInsert(
    participation: ParticipationEntity,
    participantsLimit?: number,
  ): Promise<void> {
    const campaignId = participation.campaignId;

    const _participantsLimit =
      isNumber(participantsLimit) && participantsLimit > 0
        ? participantsLimit
        : -1;

    return await this.dataSource.transaction(async (txManager) => {
      const participationsRepository = txManager
        .getRepository(ParticipationEntity)
        .extend(CustomParticipationsRepositoryMethods);

      const campaignsRepository = txManager.getRepository(CampaignEntity);
      /**
       * Use parent row lock to be DB agnostic and avoid using SERIALIZABLE
       * isolation level that we have to handle deadlock error and retry
       */
      await campaignsRepository.findOne({
        where: { id: campaignId },
        lock: { mode: 'pessimistic_write' },
      });

      const nParticipants =
        await participationsRepository.countParticipants(campaignId);
      if (nParticipants >= _participantsLimit) {
        throw new MaxParticipationsError(campaignId, nParticipants);
      }

      await participationsRepository.insert(participation);
    });
  }
}

const CUSTOM_REPOSITORY_METHOD_NAMES = [
  'findByUserAndCampaign',
  'findByUserId',
  'findCampaignParticipants',
  'removeUserFromActiveCampaigns',
  'countParticipants',
] as const satisfies readonly (keyof ParticipationsRepository)[];

export const CustomParticipationsRepositoryMethods = _.pick(
  ParticipationsRepository.prototype,
  CUSTOM_REPOSITORY_METHOD_NAMES,
);
