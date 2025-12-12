export function PreventCallOverlap() {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const original = descriptor.value!;

    const lockKey = Symbol(`lock_${propertyKey}`);

    descriptor.value = async function (...args: unknown[]) {
      if (this[lockKey]) {
        return;
      }

      this[lockKey] = true;

      try {
        return await original.apply(this, args);
      } finally {
        this[lockKey] = false;
      }
    };

    return descriptor;
  };
}
