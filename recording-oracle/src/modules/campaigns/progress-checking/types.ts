export type CampaignProgressCheckerSetup = {
  exchangeName: string;
  symbol: string;
  periodStart: Date;
  periodEnd: Date;
  [x: string]: unknown;
};

export type ParticipantAuthKeys = {
  apiKey: string;
  secret: string;
};

export type BaseProgressCheckResult = {
  abuseDetected: boolean;
  score: number;
};

export type CampaignProgressMeta = Record<string, unknown>;

export interface CampaignProgressChecker<
  R extends BaseProgressCheckResult,
  M extends CampaignProgressMeta,
> {
  checkForParticipant(
    authKeys: ParticipantAuthKeys,
    participantJoinedAt: Date,
  ): Promise<R>;
  getCollectedMeta(): M;
}
