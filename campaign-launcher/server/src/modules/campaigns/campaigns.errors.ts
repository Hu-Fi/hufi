import { BaseError } from '@/common/errors/base';

abstract class CampaignError extends BaseError {
  constructor(
    readonly chainId: number,
    readonly address: string,
    message: string,
  ) {
    super(message);
  }
}

export class InvalidCampaignManifestError extends CampaignError {
  constructor(
    chainId: number,
    address: string,
    readonly details: string,
  ) {
    super(chainId, address, 'Campaign manifest is not valid');
  }
}

export class CampaignEscrowNotFoundError extends CampaignError {
  constructor(chainId: number, address: string) {
    super(chainId, address, 'Campaign escrow not found');
  }
}
