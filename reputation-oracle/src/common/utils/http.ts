import * as crypto from 'crypto';

import _ from 'lodash';

import { BaseError } from '@/common/errors/base';

class FileDownloadError extends BaseError {
  constructor(
    readonly location: string,
    readonly details: unknown,
  ) {
    super('Failed to download file');
  }
}

function isValidUrl(maybeUrl: string, protocols?: string[]): boolean {
  try {
    const url = new URL(maybeUrl);

    if (protocols?.length) {
      return protocols.includes(url.protocol.replace(':', ''));
    }

    return true;
  } catch {
    return false;
  }
}

function isValidHttpUrl(maybeUrl: string): boolean {
  return isValidUrl(maybeUrl, ['http', 'https']);
}

type DownloadFileOptions = {
  asStream?: boolean;
};
type DownloadedFile<T> = T extends { asStream: true } ? ReadableStream : Buffer;
export async function downloadFile<T extends DownloadFileOptions>(
  url: string,
  options?: T,
): Promise<DownloadedFile<T>> {
  if (!isValidHttpUrl(url)) {
    throw new FileDownloadError(url, 'Invalid http url');
  }

  const shouldReturnStream = options?.asStream === true;

  try {
    const response = await fetch(url);

    if (response.status === 404) {
      throw new FileDownloadError(url, 'File not found');
    }

    if (!response.ok) {
      throw new FileDownloadError(
        url,
        `Unsuccessful response: ${response.status}`,
      );
    }

    if (!response.body) {
      throw new FileDownloadError(url, 'No body in response');
    }

    if (shouldReturnStream) {
      return response.body as DownloadedFile<T>;
    }

    const responseBodyBuffer = await response.arrayBuffer();
    return Buffer.from(responseBodyBuffer) as DownloadedFile<T>;
  } catch (error) {
    if (error instanceof FileDownloadError) {
      throw error;
    }
    throw new FileDownloadError(url, error.message);
  }
}

type HashVerificationOptions = {
  algorithm?: 'sha256' | 'sha1' | 'md5';
};

class FileHashVerificationError extends BaseError {
  constructor(
    readonly fileUrl: string,
    readonly details: { fileHash: string; expectedHash: string },
  ) {
    super('Invalid file hash');
  }
}

export async function downloadFileAndVerifyHash(
  url: string,
  expectedHash: string,
  options?: HashVerificationOptions,
): Promise<Buffer> {
  const file = await downloadFile(url);

  const { algorithm } = _.defaults({}, options, {
    algorithm: 'sha256',
  });
  const fileHash = crypto.createHash(algorithm).update(file).digest('hex');

  if (fileHash !== expectedHash) {
    throw new FileHashVerificationError(url, { fileHash, expectedHash });
  }

  return file;
}
