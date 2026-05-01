declare module 'yauzl' {
  import type { EventEmitter } from 'events';
  import type { Readable } from 'stream';

  interface Options {
    autoClose?: boolean; // default: true
    lazyEntries?: boolean; // default: false
    decodeStrings?: boolean; // default: true
    validateEntrySizes?: boolean; // default: true
    strictFileNames?: boolean; // default: false
  }

  type FromBufferOptions = Omit<Options, 'autoClose'>;

  class Entry {
    fileName: string;
    crc32: number;
    compressionMethod: number;
    compressedSize: number;
    uncompressedSize: number;
  }

  class ZipFile extends EventEmitter {
    entryCount: number;

    readEntry(): void;

    openReadStream(
      entry: Entry,
      callback: (err: Error | null, stream: Readable) => void,
    ): void;

    close(): void;

    on(event: 'entry', listener: (entry: Entry) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
  }

  function fromBuffer(
    buffer: Buffer,
    options: FromBufferOptions,
    callback: (err: Error | null, zipfile: ZipFile) => void,
  ): void;
}
