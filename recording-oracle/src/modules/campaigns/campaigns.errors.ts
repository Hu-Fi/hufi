import { BaseError } from '@/common/errors/base';

export class CampaignNotFoundError extends BaseError {
  constructor(readonly address: string) {
    super('Campaign not found');
  }
}

export class InvalidCampaign extends BaseError {
  constructor(
    readonly address: string,
    readonly details: string,
  ) {
    super('Invalid campaign');
  }
}
