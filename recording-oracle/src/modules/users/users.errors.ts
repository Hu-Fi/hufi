import { BaseError } from '@/common/errors/base';

export class UserNotFoundError extends BaseError {
  constructor(readonly identifier: string) {
    super('User with provided identifier not found');
  }
}
