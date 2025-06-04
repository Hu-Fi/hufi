import { BaseError } from './base';

export class DatabaseError extends BaseError {}

export function handleDbError(error: any): DatabaseError {
  return new DatabaseError(error.message, error);
}
