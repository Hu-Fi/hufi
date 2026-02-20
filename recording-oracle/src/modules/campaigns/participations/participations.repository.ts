import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import type { UserEntity } from '@/modules/users';

import { CampaignEntity } from '../campaign.entity';
import { CampaignStatus } from '../types';
import { ParticipationEntity } from './participation.entity';
import { type CampaignParticipant } from './types';

@Injectable()
export class ParticipationsRepository extends Repository<ParticipationEntity> {
  constructor(dataSource: DataSource) {
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
      statuses?: CampaignStatus[];
      limit?: number;
      skip?: number;
    } = {},
  ): Promise<CampaignEntity[]> {
    const query = this.createQueryBuilder('participation')
      .leftJoinAndSelect('participation.campaign', 'campaign')
      .where('participation.userId = :userId', { userId });

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
}
