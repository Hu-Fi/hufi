import { BaseError } from './base';

export class DatabaseError extends BaseError {}

export function handleDbError(error: Error): DatabaseError {
  return new DatabaseError(error.message, error);
}
