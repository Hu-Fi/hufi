import { BaseError } from '@/common/errors/base';

export class CampaignNotFoundError extends BaseError {
  constructor(
    readonly chainId: number,
    readonly address: string,
  ) {
    super('Campaign not found');
  }
}

export class InvalidCampaign extends BaseError {
  constructor(
    readonly chainId: number,
    readonly address: string,
    readonly details: string,
  ) {
    super('Invalid campaign');
  }
}

export class CampaignAlreadyFinishedError extends BaseError {
  constructor(
    readonly chainId: number,
    readonly address: string,
  ) {
    super('Campaign already finished');
  }
}

export class CampaignNotStartedError extends BaseError {
  constructor(
    readonly chainId: number,
    readonly address: string,
  ) {
    super('Campaign not started yet');
  }
}

export class CampaignCancelledError extends BaseError {
  constructor(
    readonly chainId: number,
    readonly address: string,
  ) {
    super('Campaign cancelled');
  }
}

export class CampaignJoinLimitedError extends BaseError {
  constructor(
    readonly chainId: number,
    readonly address: string,
    readonly detail: string,
  ) {
    super('Joining the campaign is limited');
  }
}

export class UserIsNotParticipatingError extends BaseError {
  constructor() {
    super('User is not participating in campaign');
  }
}
