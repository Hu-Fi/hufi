import { BaseError } from '@/common/errors/base';

export enum CampaignErrorMessage {
  NOT_FOUND = 'Campaign not found',
  ALREADY_JOINED = 'User already joined the campaign',
}

export class CampaignNotFoundError extends BaseError {
  constructor(readonly address: string) {
    super(CampaignErrorMessage.NOT_FOUND);
  }
}

export class InvalidManifestError extends BaseError {
  constructor(
    readonly address: string,
    readonly details: string,
  ) {
    super('Invalid campaign manifest');
  }
}

export class InvalidCampaignStatusError extends BaseError {
  constructor(
    readonly address: string,
    readonly status: string,
  ) {
    super('Invalid campaign status');
  }
}
