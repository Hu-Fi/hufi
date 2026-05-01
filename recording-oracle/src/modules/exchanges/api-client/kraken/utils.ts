import type { Readable as ReadableStream } from 'stream';

import dayjs from 'dayjs';
import yauzl from 'yauzl';

import { Trade } from '../types';
import {
  ApiErrorCode,
  ApiPermissionErrorCode,
  ApiPermissionErrorCodes,
} from './constants';
import { KrakenApiError, ReportProcessingError } from './error';
import { type ReportCsvRow } from './types';

export function isApiPermissionError(
  error: unknown,
): error is KrakenApiError & { code: ApiPermissionErrorCode } {
  return (
    error instanceof KrakenApiError &&
    ApiPermissionErrorCodes.includes(error.code as ApiPermissionErrorCode)
  );
}

export function isReportNotReadyError(error: unknown): boolean {
  return (
    error instanceof KrakenApiError &&
    error.code === ApiErrorCode.REPORT_NOT_READY
  );
}

export function trimZipZeroBytes(zipBuffer: Buffer): Buffer {
  const EOCD_SIG = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const MIN_EOCD_SIZE = 22;
  /**
   * Only search for EOCD within max comment length (65535 bytes) + EOCD size
   */
  const maxEOCDSearch = Math.min(zipBuffer.length, 0xffff + MIN_EOCD_SIZE);

  let eocdIndex = -1;
  for (
    let i = zipBuffer.length - maxEOCDSearch;
    i <= zipBuffer.length - MIN_EOCD_SIZE;
    i += 1
  ) {
    if (zipBuffer.subarray(i, i + 4).equals(EOCD_SIG)) {
      eocdIndex = i;
      break;
    }
  }

  if (eocdIndex === -1) {
    throw new Error('EOCD record not found. Not a valid ZIP buffer');
  }

  const zipCommentLength = zipBuffer.readUInt16LE(eocdIndex + 20);
  const correctZipBufferLength = eocdIndex + MIN_EOCD_SIZE + zipCommentLength;
  if (zipBuffer.length > correctZipBufferLength) {
    return zipBuffer.subarray(0, correctZipBufferLength);
  } else {
    return zipBuffer;
  }
}

export function unzipReportCsv(reportZip: Buffer): Promise<ReadableStream> {
  /**
   * Kraken API returns ZIP with extra zero bytes
   * and yauzl detects them as invalid comment,
   * so trim those zero bytes.
   */
  const toUnzip = trimZipZeroBytes(reportZip);

  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(toUnzip, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        return reject(new ReportProcessingError(err.message));
      }

      if (zipfile.entryCount !== 1) {
        return reject(
          new ReportProcessingError(
            `Unexpected number of csv files in report zip: ${zipfile.entryCount}`,
          ),
        );
      }

      zipfile.on('entry', (entry) => {
        if (!entry.fileName.endsWith('.csv')) {
          return reject(
            new ReportProcessingError('Report file is not in csv format'),
          );
        }

        zipfile.openReadStream(entry, (err, csvReadStream) => {
          if (err) {
            return reject(new ReportProcessingError(err.message));
          }

          /**
           * Report zip is buffer, so just resolve read stream.
           * If it was a file - then we would need to listen for 'close'
           * event on csv stream and also close file descriptor
           * by calling zipfile.close();
           */
          return resolve(csvReadStream);
        });
      });
      zipfile.on('error', (err) =>
        reject(new ReportProcessingError(err.message)),
      );

      zipfile.readEntry();
    });
  });
}

export function normalizeTimestamp(rawTs: string): string {
  const [_upToMsPart, msPart] = rawTs.split('.');

  if (!msPart) {
    return rawTs + '.000Z';
  }

  let normalized: string;
  if (msPart.length > 3) {
    normalized = rawTs.slice(0, -1 * (msPart.length - 3));
  } else {
    normalized = rawTs + '0'.repeat(3 - msPart.length);
  }

  return normalized + 'Z';
}

// https://support.kraken.com/articles/360001184886-how-to-interpret-trades-history-fields
export function mapReportRowToTrade(csvTrade: ReportCsvRow): Trade {
  const timestamp = dayjs(
    normalizeTimestamp(csvTrade.time),
    'YYYY-MM-DD HH:mm:ss.SSSZ',
  );

  return {
    id: csvTrade.txid,
    timestamp: timestamp.valueOf(),
    symbol: csvTrade.pair,
    side: csvTrade.type,
    takerOrMaker:
      csvTrade.ordertype === 'limit' && csvTrade.misc !== 'initiated'
        ? 'maker'
        : 'taker',
    price: Number(csvTrade.price),
    amount: Number(csvTrade.vol),
    cost: Number(csvTrade.cost),
  };
}
