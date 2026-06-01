import * as Joi from 'joi';

import type {
  CampaignsAutojoinPreferences,
  NotificationsPreferences,
} from './types';

export const DEFAULT_USER_PREFERENCES: {
  telegramUserId: string | null;
  notifications: NotificationsPreferences;
  campaignsAutojoin: CampaignsAutojoinPreferences;
} = Object.freeze({
  telegramUserId: null,
  campaignsAutojoin: {
    enabled: false,
    campaignTypes: [],
    exchanges: [],
    tokens: [],
  },
  notifications: {
    campaignsAutojoin: false,
  },
});

export const MAX_CAMPAIGNS_AUTOJOIN_TOKENS = 10;

export const PREFERENCES_VALIDATION_SCHEMA = Joi.object({
  telegramUserId: Joi.string().allow(null).min(1),
  notifications: Joi.object({
    campaignsAutojoin: Joi.boolean(),
  }),
  campaignsAutojoin: Joi.object({
    enabled: Joi.boolean().required(),
    campaignTypes: Joi.array().items(Joi.string()).required(),
    exchanges: Joi.array().items(Joi.string()).required(),
    tokens: Joi.array()
      .items(Joi.string().max(10))
      .max(MAX_CAMPAIGNS_AUTOJOIN_TOKENS)
      .required(),
  }),
}).options({ allowUnknown: false });
