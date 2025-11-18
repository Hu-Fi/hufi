import { HttpError } from './HttpClient';

export function getMessageFromError(error: unknown): string | null {
  if (error instanceof HttpError && error.details?.responseMessage) {
    return error.details?.responseMessage;
  }

  return null;
}

export function getDetailsFromError(
  error: unknown
): Record<string, unknown> | null {
  if (error instanceof HttpError && error.details) {
    const details = { ...error.details };
    delete details.responseMessage;
    return details;
  }

  return null;
}
