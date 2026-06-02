import { BaseError } from '@/common/errors/base';

export class InvalidUserPreferencesError extends BaseError {
  constructor(
    readonly userId: string,
    message?: string,
  ) {
    super(message || 'User preferences are not valid');
  }
}

export class TelegramTokenVerificationError extends BaseError {
  constructor(
    readonly userId: string,
    readonly cause: string,
  ) {
    super('Failed to verify Telegram id token');
  }
}
