export type CampaignProgressCheckerSetup = {
  exchangeName: string;
  tradingPair: string;
  tradingPeriodStart: Date;
  tradingPeriodEnd: Date;
};

export type ProgressCheckResult = {
  abuseDetected: boolean;
  score: number;
  totalVolume: number;
};

export type ParticipantAuthKeys = {
  apiKey: string;
  secret: string;
};

export interface CampaignProgressChecker {
  checkForParticipant(
    authKeys: ParticipantAuthKeys,
  ): Promise<ProgressCheckResult>;
}
