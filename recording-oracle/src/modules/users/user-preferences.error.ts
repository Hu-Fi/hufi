import { BaseError } from '@/common/errors/base';

export class InvalidUserPreferencesError extends BaseError {
  constructor(
    readonly userId: string,
    message?: string,
  ) {
    super(message || 'User preferences are not valid');
  }
}
