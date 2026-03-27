import { BaseError } from '@/common/errors/base';

export class MaxParticipantsError extends BaseError {
  constructor(
    readonly campaignId: string,
    readonly nParticipants: number,
  ) {
    super('Campaign has reached the maximum number of participants');
  }
}

export class UserAlreadyJoinedError extends BaseError {
  constructor(
    readonly campaignId: string,
    readonly userId: string,
  ) {
    super('User has already joined the campaign');
  }
}
