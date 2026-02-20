import type { UserEntity } from '@/modules/users';

export type CampaignParticipant = UserEntity & {
  campaignId: string;
  joinedAt: Date;
};
