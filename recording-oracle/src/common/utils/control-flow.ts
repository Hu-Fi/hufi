import { BaseError } from '@/common/errors/base';

export class TimeoutError extends BaseError {
  constructor(message?: string) {
    super(message || 'Operation timed out');
  }
}

export async function withTimeout<T>(
  operationPromise: Promise<T>,
  timeoutMs: number,
  message?: string,
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(message));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([operationPromise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function consumeIteratorOnce<T>(
  iterable: Iterable<T> | AsyncIterable<T>,
) {
  for await (const item of iterable) {
    /**
     * Breaking the loop will correctly cleanup the iterator
     * (e.g. by calling 'return' if it has one)
     */
    return item;
  }
}

export async function consumeIterator<T>(
  iterable: Iterable<T> | AsyncIterable<T>,
) {
  const items: T[] = [];

  for await (const item of iterable) {
    items.push(item);
  }

  return items;
}
