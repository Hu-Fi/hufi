export interface CampaignProgressChecker {
  check(input: unknown): Promise<unknown>;
}
