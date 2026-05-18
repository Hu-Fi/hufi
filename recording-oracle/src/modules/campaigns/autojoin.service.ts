import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  ALLOWED_AUTOJOIN_CAMPAIGN_TYPES,
  DomainEvent,
  ExchangeName,
} from '@/common/constants';
import logger from '@/logger';
import {
  ExchangeApiKeyNotFoundError,
  ExchangesService,
  KeyAuthorizationError,
} from '@/modules/exchanges';
import { UserPreferencesRepository } from '@/modules/users';

import type { CampaignEntity } from './campaign.entity';
import { CAMPAIGN_PERMISSIONS_MAP } from './constants';
import {
  ParticipationsService,
  UserAlreadyJoinedError,
} from './participations';
import { CampaignStatus } from './types';

@Injectable()
export class AutojoinService {
  private readonly logger = logger.child({
    context: AutojoinService.name,
  });

  constructor(
    private readonly exchangesService: ExchangesService,
    private readonly participationsService: ParticipationsService,
    private readonly userPreferencesRepository: UserPreferencesRepository,
  ) {}

  @OnEvent(DomainEvent.CAMPAIGN_CREATED, { async: true })
  async handleCampaignCreated(campaign: CampaignEntity) {
    const campaignLogger = this.logger.child({
      campaignId: campaign.id,
      chaindId: campaign.chainId,
      address: campaign.address,
    });

    try {
      const shouldRunAutojoin =
        campaign.status === CampaignStatus.ACTIVE &&
        campaign.endDate.valueOf() > Date.now() &&
        // @ts-expect-error - same base enum
        ALLOWED_AUTOJOIN_CAMPAIGN_TYPES.includes(campaign.type);

      if (!shouldRunAutojoin) {
        campaignLogger.info('Campaign is not eligible for autojoin, skipping', {
          type: campaign.type,
          status: campaign.status,
          endDate: campaign.endDate,
        });
        return;
      }

      const autojoinToken = campaign.symbol.split('/')[0];
      campaignLogger.info('Started autojoin process for campaign', {
        autojoinToken,
      });

      const autojoinCandidates =
        await this.userPreferencesRepository.findForAutojoin({
          exchange: campaign.exchangeName,
          campaignType: campaign.type,
          token: autojoinToken,
        });
      campaignLogger.info('Found candidates for autojoin', {
        nCandidates: autojoinCandidates.length,
      });
      for (const { id: userId } of autojoinCandidates) {
        try {
          await this.exchangesService.assertUserHasRequiredAccess(
            userId,
            campaign.exchangeName as ExchangeName,
            CAMPAIGN_PERMISSIONS_MAP[campaign.type],
          );

          await this.participationsService.joinCampaign(userId, campaign);
          campaignLogger.info('Successfully autojoined user to campaign', {
            userId,
          });
        } catch (error) {
          if (error instanceof UserAlreadyJoinedError) {
            campaignLogger.debug('User already joined, skipping', {
              userId,
            });
            continue;
          }

          if (
            error instanceof ExchangeApiKeyNotFoundError ||
            error instanceof KeyAuthorizationError
          ) {
            campaignLogger.debug('Failed to join user due to exchange access', {
              userId,
              error,
            });
            void this.userPreferencesRepository
              .removeExchangeFromAutojoin(userId, campaign.exchangeName)
              .catch();
            continue;
          }

          throw error;
        }
      }
    } catch (error) {
      campaignLogger.error('Error during autojoin process for campaign', {
        error,
      });
    } finally {
      campaignLogger.info('Finished autojoin process for campaign');
    }
  }
}
