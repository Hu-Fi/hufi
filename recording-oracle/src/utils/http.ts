import { BaseError } from '@/common/errors/base';

class FileDownloadError extends BaseError {
  constructor(
    readonly location: string,
    readonly detail: unknown,
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
