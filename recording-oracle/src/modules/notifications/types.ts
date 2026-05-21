export enum NotificationType {
  CAMPAIGN_AUTOJOIN = 'campaign_autojoin',
}

export type NotificationPayload = {
  timestamp: number;
  [x: string]: unknown;
};

export type CampaignAutjoinPayload = NotificationPayload & {
  chainId: number;
  campaignAddress: string;
};
