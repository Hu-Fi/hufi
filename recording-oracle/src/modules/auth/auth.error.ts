import { BaseError } from '../../common/errors/base';

export enum AuthErrorMessage {
  INVALID_WEB3_SIGNATURE = 'Invalid signature',
}

export class AuthError extends BaseError {
  constructor(message: AuthErrorMessage) {
    super(message);
  }
}
