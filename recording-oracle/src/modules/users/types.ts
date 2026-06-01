import type { JWTPayload } from 'jose';

export type CampaignsAutojoinPreferences = {
  enabled: boolean;
  exchanges: string[];
  campaignTypes: string[];
  tokens: string[];
};

export type NotificationsPreferences = {
  campaignsAutojoin: boolean;
};

export type TelegramJwtPayload = JWTPayload & {
  id: string;
  name: string;
  preferred_username?: string;
  picture?: string;
};
