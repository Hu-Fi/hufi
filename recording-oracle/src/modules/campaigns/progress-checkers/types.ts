export interface CampaignProgressChecker {
  check(input: any): Promise<any>;
}
