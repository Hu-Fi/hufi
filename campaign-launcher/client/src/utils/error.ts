import { HttpError } from './HttpClient';

export function getMessageFromError(error: unknown): string | null {
  if (error instanceof HttpError && error.responseMessage) {
    return error.responseMessage;
  }

  return null;
}
