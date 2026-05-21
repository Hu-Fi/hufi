import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import _ from 'lodash';
import type { Paths } from 'type-fest';

import Environment from '@/common/utils/environment';
import * as httpUtils from '@/common/utils/http';
import * as web3Utils from '@/common/utils/web3';
import { NotificationsConfigService, Web3ConfigService } from '@/config';
import logger from '@/logger';
import {
  UserPreferencesRepository,
  type NotificationsPreferences,
} from '@/modules/users';

import { HUFI_TG_BOT_AUTH_HEADER } from './constants';
import {
  CampaignAutjoinPayload,
  NotificationType,
  type NotificationPayload,
} from './types';

@Injectable()
export class NotificationsService {
  private readonly logger = logger.child({
    context: NotificationsService.name,
  });

  private readonly typeToPreference: Record<
    NotificationType,
    Paths<NotificationsPreferences>
  >;

  constructor(
    private readonly notificationsConfigService: NotificationsConfigService,
    private readonly userPreferencesRepository: UserPreferencesRepository,
    private readonly web3ConfigService: Web3ConfigService,
  ) {
    this.typeToPreference = {
      [NotificationType.CAMPAIGN_AUTOJOIN]: 'campaignsAutojoin',
    };
  }

  private checkNotificationEnabled(
    type: NotificationType,
    preferences: NotificationsPreferences,
  ): boolean {
    const path = this.typeToPreference[type];
    if (!path) {
      return false;
    }

    return !!_.get(preferences, path);
  }

  async maybeSendNotification(
    userId: string,
    type: NotificationType.CAMPAIGN_AUTOJOIN,
    payload: CampaignAutjoinPayload,
  ): Promise<void>;
  async maybeSendNotification(
    userId: string,
    type: NotificationType,
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      const hufiTgBotUrl = this.notificationsConfigService.hufiTgBotUrl;
      if (!hufiTgBotUrl) {
        if (Environment.isDevelopment()) {
          this.logger.debug('HuFi tg bot url not set. Logging notification', {
            userId,
            type,
            payload,
          });
        }

        return;
      }

      const preferences = await this.userPreferencesRepository.findOneById(
        userId,
        {
          relations: {
            user: true,
          },
        },
      );
      if (!preferences || !preferences.notifications.telegramUserId) {
        return;
      }

      if (!this.checkNotificationEnabled(type, preferences.notifications)) {
        return;
      }

      const tgWebhookPayload = {
        type,
        telegramUserId: preferences.notifications.telegramUserId,
        userId,
        userEvmAddress: preferences.user!.evmAddress,
        ...payload,
      };

      const signature = await web3Utils.signMessage(
        tgWebhookPayload,
        this.web3ConfigService.privateKey,
      );

      await axios.post(hufiTgBotUrl, tgWebhookPayload, {
        headers: {
          [HUFI_TG_BOT_AUTH_HEADER]: signature,
        },
      });
    } catch (error) {
      let formattedError = error;
      if (error instanceof AxiosError) {
        formattedError = httpUtils.formatAxiosError(error);
      }
      this.logger.error('Error while trying to send notification', {
        userId,
        notification: {
          type,
          payload,
        },
        error: formattedError,
      });
    }
  }
}
