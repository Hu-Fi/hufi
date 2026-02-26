import { ExchangeName } from '@/common/constants';

import type { CampaignParticipant } from '../participations/types';

export type CampaignProgressCheckerSetup = {
  exchangeName: ExchangeName;
  symbol: string;
  periodStart: Date;
  periodEnd: Date;
  [x: string]: unknown;
};

export type BaseProgressCheckResult = {
  abuseDetected: boolean;
  score: number;
};

export type CampaignProgressMeta = Record<string, unknown>;

export type ParticipantInfo = Pick<CampaignParticipant, 'id' | 'joinedAt'>;

export interface CampaignProgressChecker<
  R extends BaseProgressCheckResult,
  M extends CampaignProgressMeta,
> {
  checkForParticipant(participant: ParticipantInfo): Promise<R>;
  getCollectedMeta(): M;
}
