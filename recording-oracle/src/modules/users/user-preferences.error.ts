import { BaseError } from '@/common/errors/base';

export class InvalidUserPrefernecesError extends BaseError {
  constructor(
    readonly userId: string,
    message?: string,
  ) {
    super(message || 'User preferences are not valid');
  }
}
