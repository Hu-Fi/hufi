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
