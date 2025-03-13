import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';

import { ErrorWebhook } from '../../common/constants/errors';

import { WebhookIncomingEntity } from './webhook-incoming.entity';
import {
  WebhookIncomingCreateDto,
  WebhookIncomingUpdateDto,
} from './webhook.dto';

@Injectable()
export class WebhookRepository {
  private readonly logger = new Logger(WebhookRepository.name);

  constructor(
    @InjectRepository(WebhookIncomingEntity)
    private readonly webhookIncomingEntityRepository: Repository<WebhookIncomingEntity>,
  ) {}

  public async updateOne(
    where: FindOptionsWhere<WebhookIncomingEntity>,
    dto: Partial<WebhookIncomingUpdateDto>,
  ): Promise<WebhookIncomingEntity> {
    const webhookIncomingEntity =
      await this.webhookIncomingEntityRepository.findOneBy(where);

    if (!webhookIncomingEntity) {
      this.logger.error(ErrorWebhook.NotFound, WebhookRepository.name);
      throw new NotFoundException(ErrorWebhook.NotFound);
    }

    Object.assign(webhookIncomingEntity, dto);
    return webhookIncomingEntity.save();
  }

  public async findOne(
    where: FindOptionsWhere<WebhookIncomingEntity>,
    options?: FindOneOptions<WebhookIncomingEntity>,
  ): Promise<WebhookIncomingEntity | null> {
    const webhookEntity = await this.webhookIncomingEntityRepository.findOne({
      where,
      ...options,
    });

    return webhookEntity;
  }

  public find(
    where: FindOptionsWhere<WebhookIncomingEntity>,
    options?: FindManyOptions<WebhookIncomingEntity>,
  ): Promise<WebhookIncomingEntity[]> {
    return this.webhookIncomingEntityRepository.find({
      where,
      // You can override this default 'order' by passing
      // an 'order' key in the 'options' argument if needed
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async create(
    dto: WebhookIncomingCreateDto,
  ): Promise<WebhookIncomingEntity> {
    try {
      // Create a new entity instance
      const entity = this.webhookIncomingEntityRepository.create(dto);
      // Save it to the database
      return await this.webhookIncomingEntityRepository.save(entity);
    } catch (e) {
      this.logger.error(
        `Failed to create webhook entity: ${e.message}`,
        e.stack,
      );
      // Instead of returning undefined, we throw the error
      throw e;
    }
  }
}
