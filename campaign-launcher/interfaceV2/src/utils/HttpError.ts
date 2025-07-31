import { AxiosError } from "axios";

export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class HttpError extends BaseError {
  constructor(message: string, readonly status?: number) {
    super(message);
  }

  static fromAxiosError(error: AxiosError<{ message?: string }>): HttpError {
    return new HttpError(
      error.response?.data?.message || error.message || 'Request failed',
      error.response?.status,
    );
  }
}