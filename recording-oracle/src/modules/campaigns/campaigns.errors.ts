import { BaseError } from '@/common/errors/base';

export enum CampaignErrorMessage {
  NOT_FOUND = 'Campaign not found',
  ALREADY_JOINED = 'User already joined the campaign',
}

export class CampaignNotFoundError extends BaseError {
  address: string;
  constructor(address: string) {
    super(CampaignErrorMessage.NOT_FOUND);
    this.address = address;
  }
}

export class InvalidManifestError extends BaseError {
  address: string;
  constructor(address: string, details: string) {
    super(`Invalid campaign manifest: ${details}`);
    this.address = address;
  }
}

export class InvalidCampaignStatusError extends BaseError {
  address: string;
  constructor(address: string, status: string) {
    super(`Invalid campaign status: ${status}`);
    this.address = address;
  }
}
