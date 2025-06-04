import { BaseError } from '@/common/errors/base';

export enum AuthErrorMessage {
  INVALID_WEB3_SIGNATURE = 'Invalid signature',
  INVALID_REFRESH_TOKEN = 'Refresh token is not valid',
  REFRESH_TOKEN_EXPIRED = 'Refresh token expired',
}

export class AuthError extends BaseError {
  constructor(message: AuthErrorMessage) {
    super(message);
  }
}
